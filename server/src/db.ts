import { CosmosClient, Container } from "@azure/cosmos";

const endpoint =
  process.env.COSMOS_ENDPOINT || "https://internal-dev.documents.azure.com:443/";
const key = process.env.COSMOS_KEY || "";

if (!key) {
  console.error(
    "COSMOS_KEY is not set. Set it as an environment variable or in a .env file."
  );
  process.exit(1);
}

const client = new CosmosClient({ endpoint, key });

let _container: Container;

export async function initDb(): Promise<void> {
  const { database } = await client.databases.createIfNotExists({
    id: "SoulLink",
  });
  const { container } = await database.containers.createIfNotExists({
    id: "sessions",
    partitionKey: { paths: ["/id"] },
  });
  _container = container;
  console.log("Cosmos DB connected — database: SoulLink, container: sessions");
}

export function getContainer(): Container {
  if (!_container)
    throw new Error("Database not initialized — call initDb() first");
  return _container;
}
