TO RUN:

1. npm i
2. create a .env file with - DATABASE_URL="postgresql://postgres:randompassword@localhost:5432/postgres"
3. docker run -p 5432:5432 -e POSTGRES_PASSWORD=randompassword --name prism-backend postgres
4. tsc -b
5. node dist/server
