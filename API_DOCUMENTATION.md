# Cake Delight -- API Documentation

## 1. Overview

Cake Delight is a cloud-native cake ordering application. The API
Gateway is the single entry point for frontend requests and forwards
them to the backend microservices.

**Kubernetes frontend URL:** `http://localhost:30080`\
**Frontend API prefix:** `/api`\
**API Gateway internal port:** `8080`

Use `http://localhost:30080/api` for requests routed through the
frontend proxy. The API Gateway's own service paths are
`/catalog/cakes`, `/orders`, `/ratings`, and `/notifications`. The
gateway configuration preserves these paths.

All request and response bodies use JSON unless otherwise stated.

## 2. API Gateway

  Method   Endpoint    Description
  -------- ----------- -------------------------------------------
  GET      `/health`   Checks whether the API Gateway is running

Example response (`200 OK`):

``` json
{"message":"API Gateway is running"}
```

## 3. Cake Catalog Service

**Gateway route prefix:** `/catalog/cakes`

### 3.1 Get all cakes

-   **Method:** GET
-   **Endpoint:** `/catalog/cakes`
-   **Description:** Retrieves cakes, with optional search and filters.

  Query parameter   Type     Description
  ----------------- -------- ---------------------------------------------
  `name`            String   Case-insensitive partial match on cake name
  `category`        String   Exact category match
  `maxPrice`        Number   Returns cakes priced at or below this value

Example:
`GET /catalog/cakes?name=chocolate&category=Birthday&maxPrice=1000`

Success response (`200 OK`):

``` json
[
  {
    "id": "CAKE_ID",
    "name": "Chocolate Cake",
    "description": "Chocolate cake description",
    "category": "Birthday",
    "price": 900,
    "available": true,
    "imageUrl": "IMAGE_URL"
  }
]
```

### 3.2 Get cake by ID

-   **Method:** GET
-   **Endpoint:** `/catalog/cakes/:id`
-   **Description:** Retrieves one cake by its ID.

Example: `GET /catalog/cakes/CAKE_ID`

Success response (`200 OK`):

``` json
{
  "id": "CAKE_ID",
  "name": "Chocolate Cake",
  "description": "Chocolate cake description",
  "category": "Birthday",
  "price": 900,
  "available": true,
  "imageUrl": "IMAGE_URL"
}
```

If the cake does not exist, the service returns `404 Not Found` with
`{"message":"Cake not found"}`.

## 4. Order Service

**Gateway route prefix:** `/orders`

Basket and checkout endpoints identify the user through the `x-user-id`
request header.

Example: `x-user-id: user123`

### 4.1 Get basket

-   **Method:** GET
-   **Endpoint:** `/orders/basket`
-   **Description:** Retrieves the user's basket. If one does not exist,
    an empty basket is created.
-   **Required header:** `x-user-id`

Success response (`200 OK`):

``` json
{
  "items": [
    {
      "cakeId": "CAKE_ID",
      "name": "Chocolate Cake",
      "unitPrice": 900,
      "quantity": 1
    }
  ],
  "total": 900
}
```

### 4.2 Add item to basket

-   **Method:** POST
-   **Endpoint:** `/orders/basket/items`
-   **Description:** Adds a cake. If it is already in the basket, its
    quantity is increased.
-   **Required header:** `x-user-id`

Request body:

``` json
{
  "cakeId": "CAKE_ID",
  "quantity": 1
}
```

`quantity` is optional and defaults to `1`.

Success response (`200 OK`): updated `items` array and `total`, using
the Get basket response structure.

### 4.3 Update basket item quantity

-   **Method:** PUT
-   **Endpoint:** `/orders/basket/items/:cakeId`
-   **Description:** Sets the quantity of an existing basket item.
-   **Required header:** `x-user-id`

Request body:

``` json
{"quantity":2}
```

Success response (`200 OK`): updated `items` array and `total`.

Possible errors: `400 Bad Request` for a missing user ID or invalid
quantity; `404 Not Found` if the basket or item does not exist.

### 4.4 Remove basket item

-   **Method:** DELETE
-   **Endpoint:** `/orders/basket/items/:cakeId`
-   **Description:** Removes the specified cake from the user's basket.
-   **Required header:** `x-user-id`

Success response (`200 OK`): updated `items` array and `total`.

Possible errors: `400 Bad Request` if the user ID is missing;
`404 Not Found` if the basket does not exist.

### 4.5 Checkout

-   **Method:** POST
-   **Endpoint:** `/orders/checkout`
-   **Description:** Rechecks current cake prices and availability
    through the Catalog Service, creates a confirmed order, clears the
    basket and publishes an `ORDER_CREATED` event to RabbitMQ.
-   **Required header:** `x-user-id`

Request body:

``` json
{
  "name": "Customer Name",
  "email": "customer@example.com",
  "phone": "9876543210",
  "address": "Customer delivery address"
}
```

Success response (`201 Created`):

``` json
{
  "orderId": "ORDER_ID",
  "status": "CONFIRMED",
  "total": 900,
  "createdAt": "2026-11-16T12:00:00.000Z"
}
```

Possible `400 Bad Request` cases include missing customer details, an
empty basket or an unavailable cake.

**Implementation note:** The order is created before the RabbitMQ event
is published. If event publishing fails, the controller logs the failure
and still returns the created order response.

## 5. Rating Service

**Gateway route prefix:** `/ratings`

### 5.1 Get cake rating summary

-   **Method:** GET
-   **Endpoint:** `/ratings/:cakeId/summary`
-   **Description:** Retrieves the average rating and number of ratings
    for a cake.

Example: `GET /ratings/CAKE_ID/summary`

Success response (`200 OK`):

``` json
{"average":4.5,"count":10}
```

If there are no ratings, the response is `{"average":0,"count":0}`.

### 5.2 Submit a cake rating

-   **Method:** POST
-   **Endpoint:** `/ratings`
-   **Description:** Submits a rating for a cake.

Request body:

``` json
{
  "cakeId": "CAKE_ID",
  "stars": 5
}
```

`stars` must be an integer from 1 to 5.

Success response (`201 Created`):

``` json
{
  "message": "Rating submitted successfully",
  "rating": {
    "cakeId": "CAKE_ID",
    "stars": 5
  }
}
```

The actual returned `rating` object is generated by the Rating model and
may include database-managed fields. Invalid input returns
`400 Bad Request`.

## 6. Notification Service

**Gateway route prefix:** `/notifications`

### 6.1 Get notification status

-   **Method:** GET
-   **Endpoint:** `/notifications/:orderId`
-   **Description:** Retrieves the notification status for an order.

Example: `GET /notifications/ORDER_ID`

Success response (`200 OK`):

``` json
{"status":"PENDING"}
```

When a notification record exists, the response contains its stored
status. When no record exists, the service returns `PENDING`.

## 7. Asynchronous Event Communication

After creating an order, the Order Service publishes an `ORDER_CREATED`
event to the RabbitMQ queue `order_notifications`.

Event payload:

``` json
{
  "eventType": "ORDER_CREATED",
  "orderId": "ORDER_ID",
  "email": "customer@example.com",
  "total": 900,
  "createdAt": "2026-11-16T12:00:00.000Z"
}
```

The Notification Service consumes this event and sends the order
confirmation email. This is asynchronous communication: the Order
Service does not wait for the email to be delivered before returning the
checkout response.

## 8. Common HTTP Status Codes

  -----------------------------------------------------------------------
  Status                              Meaning
  ----------------------------------- -----------------------------------
  `200 OK`                            Request completed successfully

  `201 Created`                       A new order or rating was created

  `400 Bad Request`                   Required data is missing or invalid

  `404 Not Found`                     Requested cake, basket or basket
                                      item was not found

  `500 Internal Server Error`         Unexpected server-side error
  -----------------------------------------------------------------------

## 9. Notes

-   Use the API Gateway as the frontend entry point rather than calling
    backend services directly.
-   Basket and checkout requests require the `x-user-id` header.
-   The Order Service calls the Catalog Service to verify cake
    availability and current prices.
-   Each service uses its own MongoDB database.
-   RabbitMQ handles asynchronous order notification events.
-   Endpoint paths and request fields are based on the inspected route,
    controller and gateway source code. Example IDs, names, prices and
    timestamps are illustrative.
