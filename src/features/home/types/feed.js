/** @typedef {'vn'|'global'} ArticleRegion */
/** @typedef {{title:string, url:string, source:string, publishedAt:string|null, region:ArticleRegion}} Article */
/** @typedef {{date:string, min:number, max:number, rainProbability:number, code:number}} WeatherDay */
/** @typedef {{time:string, temperature:number, rainProbability:number, code:number}} WeatherHour */
/** @typedef {{location:string, time:string, temperature:number, humidity:number, windSpeed:number, code:number, days:WeatherDay[], apparentTemperature:number|null, uvIndex:number|null, precipitation:number|null, isDay:boolean, hours:WeatherHour[]}} Weather */
/** @typedef {{name:string, buy:number, sell:number, updatedAt:string}} GoldQuote */
/** @typedef {{location:string, source:string, sourceUrl:string, unit:string, quotes:GoldQuote[]}} Gold */
/** @typedef {{fetchedAt:string, weather:Weather|null, gold:Gold|null, headlines:Article[], logistics:Article[], unavailableSources:string[]}} HomeFeed */
export {};
