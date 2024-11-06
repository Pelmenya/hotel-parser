import cheerio from 'cheerio';


export function extractGeoCategories($: cheerio.Root, el: cheerio.Element): string[] {
    const categories: string[] = [];
    const classes = [];
    
    const classList = $(el).attr('class')?.split(/\s+/) || [];
    for (const className of classList) {
        if (className.startsWith('Pois_item_') || className.startsWith('Perks_poi_')) {
            if (!(['Pois_item__6kOkZ', 'Perks_poi__FKQEN'].includes(className))) classes.push(className);
        }
    }

    const regex = /(?:Perks_poi_|Pois_item_)([A-Z_]+)/;

    for (const className of classes) {
        const match = className.match(regex);
        if (match && match[1]) {
            categories.push(match[1].split('__')[0]);
        }
    }

    return categories;
}
