type TAddressResponse = {
    addresses: TAddress[];
    check_info: TCheckInfo;
    request_process_time: number;
  }
  
  type TAddress = {
    areas?: {
      admin_area?: {
        name: string;
        type: string;
      };
    };
    codes: {
      abr_actual_code: string;
      abr_detected_code: string;
      fias_actual_code: string;
      kladr_actual_code: string;
      sign: string;
    };
    country: {
      code: string;
      name: string;
      sign: string;
    };
    cover: TCover[];
    fields: TField[];
    geo_data?: TGeoData;
    post_office: TPostOffice;
    pretty: string;
    quality: TQuality;
    time_zone: TTimeZone;
  }
  
  type TCover = {
    in?: string;
    out?: string;
  }
  
  type TField = {
    c?: string;
    cover?: string;
    level: string;
    name?: string;
    ns?: number;
    st?: string;
    ts?: number;
    type?: string;
  }
  
  type TGeoData = {
    house_level?: string;
    max: TCoordinates;
    mid: TCoordinates;
    min: TCoordinates;
    object_level: string;
    rel: number;
  }
  
  type TCoordinates = {
    lat: number;
    lon: number;
  }
  
  type TPostOffice = {
    dist: number;
    lat?: number;
    lon?: number;
    pretty: string;
    sign: string;
  }
  
  type TQuality = {
    canonic_fields: number;
    detected_fields: number;
    precision: number;
    recall: number;
    verified_numeric_fields: number;
  }
  
  type TTimeZone = {
    msk_zone: string;
    name: string;
    utc_zone: string;
  }
  
  type TCheckInfo = {
    alts: number;
    query: string;
    time: number;
  }
  