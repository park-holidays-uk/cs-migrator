export const defaultRegions = [{
  id: 1,
  title: 'East of England',
  counties: ['Essex', 'Suffolk']
}, {
  id: 2,
  title: 'East Midlands',
  counties: ['Derbyshire']
}, {
  id: 3,
  title: 'South West',
  counties: ['Dorset', 'Devon', 'Cornwall']
}, {
  id: 4,
  title: 'South East',
  counties: ['Sussex', 'Kent', 'Hampshire']
}, {
  id: 5,
  title: 'Yorkshire & the Humber',
  counties: ['Yorkshire']
}, {
  id: 6,
  title: 'Scotland',
  counties: ['Scotland']
}]

export const getRegionIdFromCounty = (county) => {
  for (let i = 0; i < defaultRegions.length; i += 1) {
    if (defaultRegions[i].counties.includes(county)) {
      return defaultRegions[i].id
    }
  }
  return null
}