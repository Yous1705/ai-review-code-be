/*
  Warnings:

  - A unique constraint covering the columns `[provider,providerAccountId]` on the table `UserAuthentication` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserAuthentication_provider_providerAccountId_key" ON "UserAuthentication"("provider", "providerAccountId");
