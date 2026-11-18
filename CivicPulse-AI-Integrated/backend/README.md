

\# CivicPulse Backend



CivicPulse is a Smart City Emergency Response and Incident Management Platform. It helps citizens report emergencies and enables administrators, operators, and response teams to manage incidents efficiently.



\## Features



\- User registration and login with JWT authentication

\- Role-based access control

\- Incident reporting and management

\- Incident image uploads using Cloudinary

\- Response team management

\- Incident assignment and resolution

\- Department management

\- Notifications with Socket.IO

\- AI-powered incident assistance using Gemini

\- Analytics and feedback management

\- Request validation and rate limiting

\- MongoDB database integration



\## Tech Stack



\- Node.js

\- Express.js

\- TypeScript

\- MongoDB and Mongoose

\- JWT and bcrypt

\- Socket.IO

\- Zod

\- Cloudinary

\- Google Gemini

\- Vitest and Supertest



\## Project Structure



```text

backend/

├── src/

│   ├── config/

│   ├── constants/

│   ├── integrations/

│   ├── middlewares/

│   ├── modules/

│   ├── sockets/

│   ├── types/

│   ├── utils/

│   ├── app.ts

│   └── server.ts

├── tests/

├── uploads/

├── .env.example

├── .gitignore

├── package.json

├── tsconfig.json

└── vitest.config.ts

```



\## Requirements



\- Node.js

\- npm

\- MongoDB database

\- Cloudinary account

\- Google Gemini API key



\## Installation



Clone the repository and enter the backend directory:



```bash

git clone YOUR\_REPOSITORY\_URL

cd civicPulse/backend

```



Install dependencies:



```bash

npm install

```



\## Environment Configuration



Create a `.env` file in the backend root directory.



Use `.env.example` as a reference and configure your own credentials.



Required variables include:



\- MONGO\_URI

\- JWT\_SECRET

\- JWT\_REFRESH\_SECRET

\- GEMINI\_API\_KEY

\- CLIENT\_URL

\- Cloudinary credentials



Never commit your actual `.env` file or API secrets.



\## Run the Backend



Development mode:



```bash

npm run dev

```



Production build:



```bash

npm run build

```



Start production server:



```bash

npm start

```



TypeScript type checking:



```bash

npm run typecheck

```



\## Testing



Run all automated tests:



```bash

npm test

```



Run individual test suites:



```bash

npx vitest run tests/auth.test.ts

npx vitest run tests/incident.test.ts

npx vitest run tests/team.test.ts

npx vitest run tests/assignment.test.ts

```



\## API Base URL



```text

http://localhost:5000/api/v1

```



Health check:



```text

GET http://localhost:5000/health

```



\## API Modules



| Module | Base Route |

|---|---|

| Authentication | /api/v1/auth |

| Users | /api/v1/users |

| Incidents | /api/v1/incidents |

| Response Teams | /api/v1/teams |

| Departments | /api/v1/departments |

| Notifications | /api/v1/notifications |

| Assignments | /api/v1/assignments |

| Feedback | /api/v1/feedback |

| AI | /api/v1/ai |

| Analytics | /api/v1/analytics |



\## Security



\- Password hashing with bcrypt

\- JWT-based authentication

\- Role-based authorization

\- Helmet security headers

\- API rate limiting

\- Request validation

\- File upload restrictions

\- Environment-based secrets



\## Testing Status



The current automated test suite includes controller-level tests with mocked service dependencies.



These tests do not replace database integration tests or end-to-end testing.



\## License



Add your chosen project license here.

```



\*\*Important:\*\* `YOUR\_REPOSITORY\_URL` placeholder hai. GitHub repository create hone ke baad actual URL add karna.



`Ctrl + S` se save karo aur `Done` batao.

