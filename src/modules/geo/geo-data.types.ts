export type TDistanceMeasurement = 'km' | 'm' | 'км' |'м';

export type TGeoData = {
    idx: number;
    name: string;
    category: string;
    distance_from_hotel: number;
    measurement: TDistanceMeasurement;
    geo?: string;
}