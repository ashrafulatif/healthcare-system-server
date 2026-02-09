/* eslint-disable @typescript-eslint/no-explicit-any */
import app from "./app";

const port = process.env.PORT || 4000;

const bootstrap = () => {
  try {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error: any) {
    console.error("An error occur", error);
  }
};

bootstrap();
