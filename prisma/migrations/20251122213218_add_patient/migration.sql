-- CreateTable
CREATE TABLE "patients" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "gender" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_userId_key" ON "patients"("userId");
