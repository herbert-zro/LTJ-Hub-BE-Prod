import { envs } from "./config/env/envs";
import { Server } from "./app/server/server";
import { AppRoutes } from "./app/routing/routes";

(async () => {
  main();
})();

function main() {
  const server = new Server({
    port: envs.PORT,
    router: AppRoutes.routes(),
  });

  server.start();
}
