import { createEntries } from "../tools";

export const createAccommodationGrades = async (context, migrationConfig) => {

  const cachedGrades = Object.keys(context.cache[migrationConfig.name] ?? {}).map((plId) => ({
    id: plId,
    title: context.cache[migrationConfig.name][plId]?.title ?? '',
  }));

  const accommodationGrades = await createEntries(
    migrationConfig,
    context,
    'accommodation_grade',
    cachedGrades,
    async (grade) => {
      return ({
        entry: {
          'title': grade.title,
        }
      });
    },
    ({ entry }) => ({
      uid: entry.uid,
      title: entry.title,
      from: 'pl.craft_content partially manual input',
    })
  )
  return accommodationGrades
};
