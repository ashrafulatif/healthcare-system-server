/*
  Warnings:

  - You are about to drop the column `videoCallingId` on the `appointments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[yvideoCallingId]` on the table `appointments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `yvideoCallingId` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "appointments_videoCallingId_key";

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "videoCallingId",
ADD COLUMN     "yvideoCallingId" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "appointments_yvideoCallingId_key" ON "appointments"("yvideoCallingId");
