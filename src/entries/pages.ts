import { createEntries } from '../tools'

const urlMapping = {
  'Alberta (Ownership)': '/our-parks/kent/alberta/caravan-holiday-homes-for-sale',
  'Ashbourne Heights (Ownership)': '/our-parks/derbyshire/ashbourne-heights/caravan-holiday-homes-for-sale',
  'Beauport (Ownership)': '/our-parks/sussex/beauport/caravan-holiday-homes-for-sale',
  'Birchington Vale (Ownership)': '/our-parks/kent/birchington-vale/caravan-holiday-homes-for-sale',
  'Bodmin (Ownership)': '/our-parks//bodmin/caravan-holiday-homes-for-sale',
  'Bowland Fell (Ownership)': '/our-parks/yorkshire/bowland-fell/caravan-holiday-homes-for-sale',
  'Broadland Sands (Ownership)': '/our-parks/suffolk/broadland-sands/caravan-holiday-homes-for-sale',
  'Burghead (Ownership)': '/our-parks/scotland/burghead/caravan-holiday-homes-for-sale',
  'Carlton Meres (Ownership)': '/our-parks/suffolk/carlton-meres/caravan-holiday-homes-for-sale',
  'Chichester Lakeside (Ownership': '/our-parks/sussex/chichester-lakeside/caravan-holiday-homes-for-sale',
  'Coghurst Hall (Ownership)': '/our-parks/sussex/coghurst-hall/caravan-holiday-homes-for-sale',
  'Dawlish Sands (Ownership)': '/our-parks/devon/dawlish-sands/caravan-holiday-homes-for-sale',
  'Dovercourt (Ownership)': '/our-parks/essex/dovercourt/caravan-holiday-homes-for-sale',
  'Felixstowe Beach (Ownership)': '/our-parks/suffolk/felixstowe-beach/caravan-holiday-homes-for-sale',
  'Golden Sands (Ownership)': '/our-parks/devon/golden-sands/caravan-holiday-homes-for-sale',
  'Harts (Ownership)': '/our-parks/kent/harts/caravan-holiday-homes-for-sale',
  'Hedley Wood  (Ownership)': '/our-parks/devon/hedley-wood/caravan-holiday-homes-for-sale',
  'Hengar Manor (Ownership)': '/our-parks/cornwall/hengar-manor/caravan-holiday-homes-for-sale',
  'Landscove (Ownership)': '/our-parks/devon/landscove/caravan-holiday-homes-for-sale',
  'Lossiemouth (Ownership)': '/our-parks/scotland/lossiemouth/caravan-holiday-homes-for-sale',
  'Marlie (Ownership)': '/our-parks/kent/marlie/caravan-holiday-homes-for-sale',
  'Martello Beach (Ownership)': '/our-parks/essex/martello-beach/caravan-holiday-homes-for-sale',
  'New Beach (Ownership)': '/our-parks/kent/new-beach/caravan-holiday-homes-for-sale',
  'Oaklands': '/our-parks/essex/oaklands/caravan-holiday-homes-for-sale',
  'Pakefield (Ownership)': '/our-parks/suffolk/pakefield/caravan-holiday-homes-for-sale',
  'Pevensey Bay (Ownership)': '/our-parks/sussex/pevensey-bay/caravan-holiday-homes-for-sale',
  'Riviera Bay (Ownership)': '/our-parks/devon/riviera-bay/caravan-holiday-homes-for-sale',
  'Rye Harbour (Ownership)': '/our-parks/sussex/rye-harbour/caravan-holiday-homes-for-sale',
  'Sand le Mere (Ownership)': '/our-parks/yorkshire/sand-le-mere/caravan-holiday-homes-for-sale',
  'Sandhills (Ownership)': '/our-parks/dorset/sandhills/caravan-holiday-homes-for-sale',
  'Seaview (Ownership)': '/our-parks/kent/seaview/caravan-holiday-homes-for-sale',
  'Seaview Village - Polperro (Ow': '/our-parks/cornwall/polperro/caravan-holiday-homes-for-sale',
  'Seawick (Ownership)': '/our-parks/essex/seawick/caravan-holiday-homes-for-sale',
  'Silver Sands (Ownership)': '/our-parks/scotland/silver-sands/caravan-holiday-homes-for-sale',
  'Solent Breezes (Ownership)': '/our-parks/hampshire/solent-breezes/caravan-holiday-homes-for-sale',
  'St Osyth (Ownership)': '/our-parks/essex/st-osyth-beach/caravan-holiday-homes-for-sale',
  'Steeple Bay (Ownership)': '/our-parks/essex/steeple-bay/caravan-holiday-homes-for-sale',
  'Suffolk Sands (Ownership)': '/our-parks/suffolk/suffolk-sands/caravan-holiday-homes-for-sale',
  'Tarka (Ownership)': '/our-parks/devon/tarka/caravan-holiday-homes-for-sale',
  'Trevella (Ownership)': '/our-parks/cornwall/trevella/caravan-holiday-homes-for-sale',
  'Turnberry (Ownership)': '/our-parks/scotland/turnberry/caravan-holiday-homes-for-sale',
  'Waterside (Ownership)': '/our-parks/devon/waterside/caravan-holiday-homes-for-sale',
  'West Mersea (Ownership)': '/our-parks/essex/west-mersea/caravan-holiday-homes-for-sale',
  'Winchelsea Sands (Ownership)': '/our-parks/sussex/winchelsea-sands/caravan-holiday-homes-for-sale',
  'Wood Farm (Ownership)': '/our-parks/dorset/wood-farm/caravan-holiday-homes-for-sale',
}

export const createOwnershipParkWebpages = async (context, migrationConfig) => {
  const parkOwnershipWebpages = await context.db.query(`
    SELECT * FROM pages
    WHERE body_css = 'park'
    AND sector_id = '3'
    AND deleted_at IS NULL;
  `)
  const ownershipParkWebpageEntries = await createEntries(
    migrationConfig,
    context,
    'webpage',
    parkOwnershipWebpages ,
    (page) => ({
      entry: {
        title: page.navigation_label,
        url: urlMapping[page.navigation_label],
        seo: {
          page_title: page.title,
          meta_description: page.description,
          canonical_url: urlMapping[page.navigation_label],
          enable_for_robots: true,
          enable_for_sitemap: true,
        },
      }
    }),
    ({ entry }) => ({
      uid: entry.uid,
      title: entry.title,
      from: 'db.pages',
    })
  )
  return ownershipParkWebpageEntries
}