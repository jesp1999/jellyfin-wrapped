import {
  getChristmas,
  getHalloween,
  getValentinesDay,
} from "date-fns-holiday-us";
import { addDays, endOfDay, isAfter, isSameDay, startOfDay } from "date-fns";

export function getHolidayYear(holidayDate: Date, today: Date): number {
  return isAfter(today, holidayDate) && !isSameDay(today, holidayDate)
    ? today.getFullYear()
    : today.getFullYear() - 1;
}

export function getHolidayDates(today: Date) {
  const christmasYear = getHolidayYear(
    getChristmas(today.getFullYear()),
    today
  );
  const halloweenYear = getHolidayYear(
    getHalloween(today.getFullYear()),
    today
  );
  const valentinesYear = getHolidayYear(
    getValentinesDay(today.getFullYear()),
    today
  );

  return {
    christmas: getChristmas(christmasYear),
    halloween: getHalloween(halloweenYear),
    valentines: getValentinesDay(valentinesYear),
  };
}

// The latest occurrence of each holiday that falls inside the timeframe, or null when none does.
export function getHolidayDatesIn(start: Date, end: Date) {
  const from = startOfDay(start);
  const to = endOfDay(end);
  const latest = (get: (year: number) => Date, offset = 0): Date | null => {
    for (let year = to.getFullYear(); year >= from.getFullYear(); year--) {
      const date = addDays(get(year), offset);
      if (date >= from && date <= to) return date;
    }
    return null;
  };
  return {
    christmas: latest(getChristmas),
    christmasEve: latest(getChristmas, -1),
    halloween: latest(getHalloween),
    valentines: latest(getValentinesDay),
  };
}
