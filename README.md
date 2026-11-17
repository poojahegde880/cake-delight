# Cake Delight

A cloud-native cake ordering application built with React, Node.js microservices, MongoDB, RabbitMQ, Docker and Kubernetes.

Cake Delight allows customers to browse cakes, search and filter the catalog, manage a basket, place orders, rate cakes and receive order confirmation emails.

## Features

- Browse cakes and view cake details
- Search cakes by name
- Filter cakes by category and maximum price
- Add cakes to the basket, update quantities and remove items
- Checkout with customer and delivery details
- Recheck cake availability and current prices during checkout
- Submit cake ratings and view rating summaries
- Publish order events through RabbitMQ
- Send order confirmation emails asynchronously
- Deploy and manage services using Kubernetes

## Architecture

The application uses an API Gateway as the frontend's backend entry point. The gateway forwards requests to the relevant microservice.

### Microservices

| Component | Responsibility | Port |
|---|---|---:|
| Frontend | React user interface | 80 in containers; 5173 in Vite development |
| API Gateway | Routes frontend API requests to backend services | 8080 |
| Catalog Service | Retrieves cakes and supports search/filtering | 8001 |
| Order Service | Manages baskets and checkout | 8002 |
| Rating Service | Accepts ratings and provides rating summaries | 8003 |
| Notification Service | Tracks notification status and consumes order events | 8004 |
| MongoDB | Stores service data in separate databases | 27017 |
| RabbitMQ | Message broker for asynchronous order notifications | 5672 |

### Request and event flow

1. The frontend sends API requests through the `/api` prefix.
2. Nginx (container/Kubernetes) or the Vite development proxy forwards the request to the API Gateway and removes the `/api` prefix.
3. The API Gateway routes the request to Catalog, Order, Rating or Notification Service.
4. The services use MongoDB for persistence.
5. During checkout, the Order Service verifies cake availability and current prices with the Catalog Service.
6. The Order Service creates the order, clears the basket and publishes an `ORDER_CREATED` event to RabbitMQ.
7. The Notification Service consumes the event and sends an order confirmation email.

Order notification is asynchronous: checkout does not wait for email delivery.

## Technology Stack

**Frontend**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion

**Backend**
- Node.js
- Express
- Mongoose
- Axios (Order Service to Catalog Service communication)
- HTTP Proxy Middleware (API Gateway)
- Nodemailer (email delivery)
- amqplib (RabbitMQ messaging)

**Infrastructure**
- MongoDB 8
- RabbitMQ 3 Management
- Docker and Docker Compose
- Kubernetes
- Nginx

## Project Structure

```text
cake-delight-frontend/
├── backend/
│   ├── api-gateway/
│   ├── catalog-service/
│   ├── order-service/
│   ├── rating-service/
│   └── notification-service/
├── k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── mongo.yaml
│   ├── rabbitmq.yaml
│   ├── catalog.yaml
│   ├── order.yaml
│   ├── rating.yaml
│   ├── notification.yaml
│   ├── gateway.yaml
│   └── frontend.yaml
├── src/
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── vite.config.ts
├── .env.example
├── API_DOCUMENTATION.md
└── README.md
```

The `k8s/` directory may also contain backup or migration manifests. Review the individual YAML files before applying them; do not apply the entire directory indiscriminately.

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for the API Gateway health endpoint, microservice endpoints, query parameters, required headers, request/response examples and RabbitMQ event payload.

### API Gateway paths

| Service | Gateway path prefix |
|---|---|
| Catalog | `/catalog/cakes` |
| Order | `/orders` |
| Rating | `/ratings` |
| Notification | `/notifications` |
| Gateway health | `/health` |

The gateway preserves these paths. The frontend proxy strips `/api` before forwarding requests.

Basket and checkout requests require the `x-user-id` header.

## Prerequisites

For local development:
- Node.js and npm
- MongoDB
- RabbitMQ

For container deployment:
- Docker Desktop or Docker Engine with Docker Compose

For Kubernetes deployment:
- A running Kubernetes cluster
- `kubectl` configured to use that cluster
- The required application Docker images available to the cluster

## Configuration

### Frontend

The root `.env.example` contains:

```env
VITE_API_URL=
```

Copy it to `.env` if you want to use the example file:

```powershell
Copy-Item .env.example .env
```

Leaving `VITE_API_URL` empty uses the `/api` proxy path.

For Vite development, `vite.config.ts` proxies `/api` to `http://localhost:8080` by default and removes the `/api` prefix. You can override the gateway target with `GATEWAY_URL`.

For Docker/Kubernetes, `nginx.conf` proxies `/api/` to `http://api-gateway:8080/`.

### Notification Service

The Docker Compose configuration references:

`backend/notification-service/.env`

This file was not present as an example in the inspected project. Create it locally with the email and RabbitMQ settings required by the Notification Service implementation. Keep credentials private and do not commit the file.

### Secrets

Do not commit real email credentials, RabbitMQ passwords or other secrets. In Kubernetes, provide the required values through Kubernetes Secrets. The deployment manifests reference the application and RabbitMQ secrets.

## Run with Docker Compose

From the project root:

```powershell
docker compose up --build -d
```

Check container status:

```powershell
docker compose ps
```

View logs:

```powershell
docker compose logs -f
```

Stop the stack:

```powershell
docker compose down
```

The Compose file maps these host ports:

| Component | Host address |
|---|---|
| Frontend | `http://localhost:5173` |
| API Gateway | `http://localhost:8080` |
| RabbitMQ AMQP | `localhost:5673` |
| RabbitMQ Management UI | `http://localhost:15673` |

MongoDB and the individual backend services are not published to host ports in the supplied Compose file; they communicate over the Compose network.

The Compose configuration uses a named volume for MongoDB data. RabbitMQ authentication and Notification Service email configuration must be set consistently with the environment expected by the service code and broker.

## Run the Frontend in Development Mode

Install frontend dependencies:

```powershell
npm install
```

Start the Vite development server:

```powershell
npm run dev
```

Open:

`http://localhost:5173`

The Vite proxy expects the API Gateway at `http://localhost:8080` by default. Start the backend services and their MongoDB/RabbitMQ dependencies before using the application.

Create a production frontend build:

```powershell
npm run build
```

Preview the production build locally:

```powershell
npm run preview
```

## Backend Service Development

Each backend service has its own `package.json` and provides `start` and `dev` scripts.

Example for the Catalog Service:

```powershell
cd backend/catalog-service
npm install
npm run dev
```

The same pattern applies to:
- `backend/api-gateway`
- `backend/catalog-service`
- `backend/order-service`
- `backend/rating-service`
- `backend/notification-service`

Configure each service's environment variables for its port, MongoDB database, dependent service URLs and RabbitMQ/email settings as required by that service. The service ports and MongoDB database names are shown in `docker-compose.yml` and `k8s/configmap.yaml`.

## Kubernetes Deployment

The project includes Kubernetes manifests in `k8s/` for the namespace, configuration, MongoDB, RabbitMQ, backend services, API Gateway and frontend.

The frontend is exposed through NodePort `30080` in the supplied frontend manifest.

### Important before applying manifests

The `k8s/` directory also contains files with names indicating backups or migration work, including `rabbitmq-before-pvc.yaml` and `rabbitmq-migration.yaml`, as well as secret manifests. Do not run `kubectl apply -f .\k8s\` without reviewing the directory: it may apply obsolete or temporary resources.

Review the manifests and apply only the intended active resources in the correct order. Ensure the namespace, ConfigMap, persistent volume claims and Kubernetes Secrets are prepared before deploying the application services. Preserve the RabbitMQ persistent volume and its existing node identity/data configuration.

Useful commands:

```powershell
kubectl get pods -n cake-delight
kubectl get services -n cake-delight
kubectl get pvc -n cake-delight
```

Open the application when the cluster and NodePort service are running:

`http://localhost:30080`

## Data and Messaging

The application uses separate MongoDB databases for the services:

- `cake_catalog`
- `cake_orders`
- `cake_ratings`
- `cake_notifications`

The Order Service publishes an `ORDER_CREATED` event to the RabbitMQ queue `order_notifications`. The Notification Service consumes the event and sends the confirmation email.

The event payload documented from the application publisher contains:
- `eventType`
- `orderId`
- `email`
- `total`
- `createdAt`

## Health Checks

The backend services expose `/health` endpoints, and the API Gateway exposes `/health`. Docker Compose and Kubernetes manifests use health probes/checks to assess service availability.

## Security Notes

- Keep `.env` files and credentials out of source control.
- Use Kubernetes Secrets for sensitive deployment configuration.
- Do not expose internal database or message-broker ports publicly unless required.
- The `x-user-id` header in this project identifies a basket user; it should not be treated as production-grade authentication by itself.

## Project Status

The application includes a React frontend, four backend microservices, an API Gateway, MongoDB persistence, RabbitMQ-based asynchronous notifications, Docker containerization and Kubernetes deployment manifests.
