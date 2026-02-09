import { Specialty } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const createSpecialty = async (payload: Specialty): Promise<Specialty> => {
  const result = await prisma.specialty.create({
    data: payload,
  });

  return result;
};

const getAllSpecialties = async () => {
  const result = await prisma.specialty.findMany();

  return result;
};

const deleteSpecialties = async (id: string) => {
  const result = await prisma.specialty.delete({
    where: {
      id,
    },
  });

  return result;
};

const updateSpecialty = async (id: string, payload: Specialty) => {
  const findSpecialty = await prisma.specialty.findUnique({ where: { id } });

  if (!findSpecialty) {
    throw new Error("Specialty not found!");
  }

  const result = await prisma.specialty.update({
    where: {
      id,
    },
    data: payload,
  });

  return result;
};

export const SpecialtyService = {
  createSpecialty,
  getAllSpecialties,
  deleteSpecialties,
  updateSpecialty,
};
