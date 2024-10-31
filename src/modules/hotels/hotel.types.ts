export type TDescription = {
    idx: number;
    title: string;
    paragraph: string;
}

export type TAboutHotel = {
    aboutHotelDescriptionTitle: string;
    aboutHotelDescriptions: TDescription[];
}