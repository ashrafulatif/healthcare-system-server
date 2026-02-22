/* eslint-disable @typescript-eslint/no-explicit-any */
import app from "./app";
import { envVars } from "./app/config/env";
import { seedSuperAdmin } from "./app/utils/seed";

const bootstrap = async () => {
  try {
    await seedSuperAdmin();
    app.listen(envVars.PORT, () => {
      console.log(`Server is running on http://localhost:${envVars.PORT}`);
    });
  } catch (error: any) {
    console.error("An error occur", error);
  }
};

bootstrap();
