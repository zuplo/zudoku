import { ZudokuEmbedded } from "zudoku/components";

const openapiYaml = `
openapi: 3.0.0
info:
  title: Sample API
  description: A simple example API demonstrating string-based embedding
  version: 1.0.0
servers:
  - url: https://api.example.com
    description: Production server
paths:
  /users:
    get:
      summary: List all users
      description: Returns a list of users from the system
      operationId: listUsers
      tags:
        - users
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
    post:
      summary: Create a new user
      description: Creates a new user in the system
      operationId: createUser
      tags:
        - users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewUser'
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
  /users/{userId}:
    get:
      summary: Get a user by ID
      description: Returns a single user
      operationId: getUserById
      tags:
        - users
      parameters:
        - name: userId
          in: path
          required: true
          description: The ID of the user to retrieve
          schema:
            type: string
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: User not found
    put:
      summary: Update a user
      description: Updates an existing user
      operationId: updateUser
      tags:
        - users
      parameters:
        - name: userId
          in: path
          required: true
          description: The ID of the user to update
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NewUser'
      responses:
        '200':
          description: User updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
    delete:
      summary: Delete a user
      description: Deletes a user from the system
      operationId: deleteUser
      tags:
        - users
      parameters:
        - name: userId
          in: path
          required: true
          description: The ID of the user to delete
          schema:
            type: string
      responses:
        '204':
          description: User deleted successfully
components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
        - name
      properties:
        id:
          type: string
          description: Unique identifier for the user
          example: "123e4567-e89b-12d3-a456-426614174000"
        email:
          type: string
          format: email
          description: User's email address
          example: "user@example.com"
        name:
          type: string
          description: User's full name
          example: "John Doe"
        createdAt:
          type: string
          format: date-time
          description: Timestamp when the user was created
          example: "2024-01-01T00:00:00Z"
    NewUser:
      type: object
      required:
        - email
        - name
      properties:
        email:
          type: string
          format: email
          description: User's email address
          example: "user@example.com"
        name:
          type: string
          description: User's full name
          example: "John Doe"
`;

export function StringExample() {
  return (
    <div className="embedded-container">
      <ZudokuEmbedded
        openApi={{
          type: "string",
          content: openapiYaml,
        }}
        config={{
          site: {
            title: "Sample API",
          },
        }}
      />
    </div>
  );
}
