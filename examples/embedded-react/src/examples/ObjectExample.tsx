import { ZudokuEmbedded } from "zudoku/components";

const openapiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Product API",
    description: "A simple product management API using object-based embedding",
    version: "1.0.0",
  },
  servers: [
    {
      url: "https://api.store.com",
      description: "Production server",
    },
  ],
  paths: {
    "/products": {
      get: {
        summary: "List all products",
        description: "Returns a paginated list of products",
        operationId: "listProducts",
        tags: ["products"],
        parameters: [
          {
            name: "page",
            in: "query",
            description: "Page number",
            schema: {
              type: "integer",
              default: 1,
            },
          },
          {
            name: "limit",
            in: "query",
            description: "Number of items per page",
            schema: {
              type: "integer",
              default: 10,
            },
          },
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    products: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Product",
                      },
                    },
                    total: {
                      type: "integer",
                    },
                    page: {
                      type: "integer",
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a new product",
        description: "Adds a new product to the catalog",
        operationId: "createProduct",
        tags: ["products"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/NewProduct",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Product created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Product",
                },
              },
            },
          },
        },
      },
    },
    "/products/{productId}": {
      get: {
        summary: "Get a product by ID",
        description: "Returns a single product",
        operationId: "getProductById",
        tags: ["products"],
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            description: "The ID of the product to retrieve",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Product",
                },
              },
            },
          },
          "404": {
            description: "Product not found",
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Product: {
        type: "object",
        required: ["id", "name", "price"],
        properties: {
          id: {
            type: "string",
            description: "Unique product identifier",
            example: "prod_123abc",
          },
          name: {
            type: "string",
            description: "Product name",
            example: "Wireless Headphones",
          },
          description: {
            type: "string",
            description: "Product description",
            example: "High-quality wireless headphones with noise cancellation",
          },
          price: {
            type: "number",
            format: "float",
            description: "Product price in USD",
            example: 99.99,
          },
          category: {
            type: "string",
            description: "Product category",
            example: "Electronics",
          },
          inStock: {
            type: "boolean",
            description: "Whether the product is in stock",
            example: true,
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Timestamp when the product was created",
            example: "2024-01-01T00:00:00Z",
          },
        },
      },
      NewProduct: {
        type: "object",
        required: ["name", "price"],
        properties: {
          name: {
            type: "string",
            description: "Product name",
            example: "Wireless Headphones",
          },
          description: {
            type: "string",
            description: "Product description",
            example: "High-quality wireless headphones with noise cancellation",
          },
          price: {
            type: "number",
            format: "float",
            description: "Product price in USD",
            example: 99.99,
          },
          category: {
            type: "string",
            description: "Product category",
            example: "Electronics",
          },
          inStock: {
            type: "boolean",
            description: "Whether the product is in stock",
            example: true,
            default: true,
          },
        },
      },
    },
  },
};

export function ObjectExample() {
  return (
    <div className="embedded-container">
      <ZudokuEmbedded
        openApi={{
          type: "object",
          spec: openapiSpec,
        }}
        config={{
          site: {
            title: "Product API",
          },
        }}
      />
    </div>
  );
}
