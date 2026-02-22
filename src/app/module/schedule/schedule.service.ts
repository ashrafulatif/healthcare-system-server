import {
  ICreateSchedulePayload,
  IUpdateSchedulePayload,
} from "./schedule.interface";
import { addHours, addMinutes, format } from "date-fns";
import { convertDateTime } from "./schedule.utils";
import { prisma } from "../../lib/prisma";
import { IQueryParams } from "../../interfaces/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Prisma, Schedule } from "../../../generated/prisma/client";
import {
  scheduleFilterableFields,
  scheduleIncludeConfig,
  scheduleSearchableFields,
} from "./schedule.constant";

const createSchedule = async (payload: ICreateSchedulePayload) => {
  const { startDate, endDate, startTime, endTime } = payload;

  const interval = 30;

  const currentDate = new Date(startDate);
  const lastDate = new Date(endDate);

  const schedules = [];

  //loop through date -> find each day
  while (currentDate <= lastDate) {
    const startDateTime = new Date(
      addMinutes(
        addHours(
          `${format(currentDate, "yyyy-MM-dd")}`,
          Number(startTime.split(":")[1]),
        ),
        Number(startTime.split(":")[1]),
      ),
    );

    const endDateTime = new Date(
      addMinutes(
        addHours(
          `${format(currentDate, "yyyy-MM-dd")}`,
          Number(endTime.split(":")[1]),
        ),
        Number(endTime.split(":")[1]),
      ),
    );
    //loop through time within date to create slot each day
    while (startDateTime < endDateTime) {
      const s = convertDateTime(startDateTime);
      const e = convertDateTime(addMinutes(startDateTime, interval));

      const scheduleData = {
        startDateTime: s,
        endDateTime: e,
      };

      //check exist schedule
      const existingSchedule = prisma.schedule.findFirst({
        where: {
          startDateTime: scheduleData.startDateTime,
          endDateTime: scheduleData.endDateTime,
        },
      });

      //create
      if (!existingSchedule) {
        const result = await prisma.schedule.create({
          data: scheduleData,
        });

        schedules.push(result);
      }

      //update min
      startDateTime.setMinutes(startDateTime.getMinutes() + interval);
    }

    //update date
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedules;
};

const getAllSchedules = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Schedule,
    Prisma.ScheduleWhereInput,
    Prisma.ScheduleInclude
  >(prisma.schedule, query, {
    searchableFields: scheduleSearchableFields,
    filterableFields: scheduleFilterableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .paginate()
    .dynamicInclude(scheduleIncludeConfig)
    .sort()
    .fields()
    .execute();

  return result;
};

const getScheduleById = async (id: string) => {
  const result = await prisma.schedule.findUnique({ where: { id: id } });

  return result;
};

const updatedSchedule = async (id: string, payload: IUpdateSchedulePayload) => {
  const { startDate, endDate, startTime, endTime } = payload;

  const startDateTime = new Date(
    addMinutes(
      addHours(
        `${format(new Date(startDate), "yyyy-MM-dd")}`,
        Number(startTime.split(":")[0]),
      ),
      Number(startTime.split(":")[1]),
    ),
  );

  const endDateTime = new Date(
    addMinutes(
      addHours(
        `${format(new Date(endDate), "yyyy-MM-dd")}`,
        Number(endTime.split(":")[0]),
      ),
      Number(endTime.split(":")[1]),
    ),
  );

  const updatedSchedule = await prisma.schedule.update({
    where: {
      id: id,
    },
    data: {
      startDateTime: startDateTime,
      endDateTime: endDateTime,
    },
  });

  return updatedSchedule;
};
const deleteSchedule = async (id: string) => {
  const result = await prisma.schedule.delete({
    where: {
      id: id,
    },
  });

  return result;
};

export const ScheduleService = {
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updatedSchedule,
  deleteSchedule,
};
