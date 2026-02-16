import { prisma } from '../src/lib/prisma';

(async () => {
  try {
    const school = await prisma.school.findFirst();
    console.log('school:', school ? `${school.id} — ${school.name}` : 'no schools');
    if (school) {
      const sd = await prisma.specialDay.count({ where: { schoolId: school.id } });
      console.log('special_days count for school:', sd);
      const nextHoliday = await prisma.specialDay.findFirst({ where: { schoolId: school.id }, orderBy: { date: 'asc' } });
      console.log('earliest special_day:', nextHoliday ? `${nextHoliday.date.toISOString().slice(0,10)} ${nextHoliday.name}` : 'none');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();