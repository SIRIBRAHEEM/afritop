export type ServiceId = "airtime" | "data" | "electricity";

export interface Network {
  id: string;
  name: string;
  short: string;
  color: string; // brand color used for avatar fallbacks
  logo?: string; // official brand logo URL (falls back to the colored initial)
}

export interface Bundle {
  id: string;
  size: string;
  price: number; // in local currency
  validity: string;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string; // ISO code, e.g. "NGN"
  currencySymbol: string;
  phonePrefix: string; // e.g. "+234"
  phoneDigits: number; // digits after the prefix
  networks: Network[];
  distributors: Network[];
  minAirtime: number;
  maxAirtime: number;
  quickAirtime: number[];
  bundles: Record<string, Bundle[]>;
  minElectricity: number;
  maxElectricity: number;
  quickElectricity: number[];
}

export const SERVICES: {
  id: ServiceId;
  label: string;
  tagline: string;
  icon: string;
}[] = [
  { id: "airtime", label: "Airtime", tagline: "Instant top-up for any mobile number", icon: "📱" },
  { id: "data", label: "Data bundles", tagline: "Surf fast with prepaid data packs", icon: "🌐" },
  { id: "electricity", label: "Electricity", tagline: "Prepaid tokens for your home & business", icon: "⚡" },
];

export const COUNTRIES: Country[] = [
  {
    code: "NG",
    name: "Nigeria",
    flag: "🇳🇬",
    currency: "NGN",
    currencySymbol: "₦",
    phonePrefix: "+234",
    phoneDigits: 10,
    networks: [
      { id: "mtn", name: "MTN Nigeria", short: "MTN", color: "#FFCC00", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2a/MTN_2022_logo.svg" },
      { id: "glo", name: "Glo", short: "GLO", color: "#00A651", logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/GloLogo.png" },
      { id: "airtel", name: "Airtel Nigeria", short: "AIRTEL", color: "#E4002B", logo: "https://upload.wikimedia.org/wikipedia/commons/d/da/Airtel_Africa_logo.svg" },
      { id: "9mobile", name: "9mobile", short: "9MOBILE", color: "#0AA089", logo: "https://www.google.com/s2/favicons?domain=9mobile.com.ng&sz=128" },
    ],
    distributors: [
      { id: "ikeja", name: "Ikeja Electric", short: "IKEDC", color: "#1F7F5C", logo: "https://www.google.com/s2/favicons?domain=ikejaelectric.com&sz=128" },
      { id: "eko", name: "Eko Electric", short: "EKEDC", color: "#F98F07", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Eko_Distribution_Company.jpg" },
      { id: "abuja", name: "Abuja Electric", short: "AEDC", color: "#3B82F6" },
      { id: "ph", name: "Port Harcourt Electric", short: "PHEDC", color: "#8B5CF6", logo: "https://upload.wikimedia.org/wikipedia/en/a/aa/PHED.PNG" },
      { id: "ibadan", name: "Ibadan Electric", short: "IBEDC", color: "#EC4899", logo: "https://www.google.com/s2/favicons?domain=ibedc.com&sz=128" },
      { id: "enugu", name: "Enugu Electric", short: "EEDC", color: "#14B8A6", logo: "https://www.google.com/s2/favicons?domain=enugudisco.com&sz=128" },
    ],
    minAirtime: 50,
    maxAirtime: 50000,
    quickAirtime: [100, 200, 500, 1000, 2000, 5000],
    bundles: {
      mtn: [
        { id: "ng-mtn-500mb", size: "500 MB", price: 300, validity: "30 days" },
        { id: "ng-mtn-1gb", size: "1 GB", price: 500, validity: "30 days" },
        { id: "ng-mtn-2gb", size: "2 GB", price: 1000, validity: "30 days" },
        { id: "ng-mtn-5gb", size: "5 GB", price: 2000, validity: "30 days" },
      ],
      glo: [
        { id: "ng-glo-1gb", size: "1 GB", price: 450, validity: "30 days" },
        { id: "ng-glo-2gb", size: "2 GB", price: 900, validity: "30 days" },
        { id: "ng-glo-5gb", size: "5 GB", price: 1800, validity: "30 days" },
      ],
      airtel: [
        { id: "ng-airtel-1gb", size: "1 GB", price: 550, validity: "30 days" },
        { id: "ng-airtel-2gb", size: "2 GB", price: 1100, validity: "30 days" },
        { id: "ng-airtel-5gb", size: "5 GB", price: 2500, validity: "30 days" },
      ],
      "9mobile": [
        { id: "ng-9m-1gb", size: "1 GB", price: 600, validity: "30 days" },
        { id: "ng-9m-2gb", size: "2 GB", price: 1200, validity: "30 days" },
      ],
    },
    minElectricity: 500,
    maxElectricity: 100000,
    quickElectricity: [1000, 2000, 5000, 10000],
  },
  {
    code: "GH",
    name: "Ghana",
    flag: "🇬🇭",
    currency: "GHS",
    currencySymbol: "GH₵",
    phonePrefix: "+233",
    phoneDigits: 9,
    networks: [
      { id: "mtn-gh", name: "MTN Ghana", short: "MTN", color: "#FFCC00", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2a/MTN_2022_logo.svg" },
      { id: "telecel", name: "Telecel (Vodafone)", short: "TELECEL", color: "#ED1C24" },
      { id: "airteltigo", name: "AirtelTigo", short: "AIRTELTIGO", color: "#0047AB", logo: "https://www.google.com/s2/favicons?domain=airteltigo.com&sz=128" },
    ],
    distributors: [
      { id: "ecg", name: "Electricity Co. of Ghana", short: "ECG", color: "#2563EB", logo: "https://www.google.com/s2/favicons?domain=ecg.com.gh&sz=128" },
      { id: "nedco", name: "Northern Electricity Co.", short: "NEDCo", color: "#F59E0B", logo: "https://www.google.com/s2/favicons?domain=nedco.com&sz=128" },
    ],
    minAirtime: 1,
    maxAirtime: 2000,
    quickAirtime: [5, 10, 20, 50, 100],
    bundles: {
      "mtn-gh": [
        { id: "gh-mtn-1gb", size: "1 GB", price: 10, validity: "30 days" },
        { id: "gh-mtn-2gb", size: "2 GB", price: 18, validity: "30 days" },
        { id: "gh-mtn-5gb", size: "5 GB", price: 35, validity: "30 days" },
        { id: "gh-mtn-10gb", size: "10 GB", price: 60, validity: "30 days" },
      ],
      telecel: [
        { id: "gh-tel-1gb", size: "1 GB", price: 12, validity: "30 days" },
        { id: "gh-tel-3gb", size: "3 GB", price: 30, validity: "30 days" },
        { id: "gh-tel-7gb", size: "7 GB", price: 55, validity: "30 days" },
      ],
      airteltigo: [
        { id: "gh-at-1gb", size: "1 GB", price: 11, validity: "30 days" },
        { id: "gh-at-2gb", size: "2 GB", price: 20, validity: "30 days" },
        { id: "gh-at-5gb", size: "5 GB", price: 40, validity: "30 days" },
      ],
    },
    minElectricity: 10,
    maxElectricity: 10000,
    quickElectricity: [20, 50, 100, 200],
  },
  {
    code: "KE",
    name: "Kenya",
    flag: "🇰🇪",
    currency: "KES",
    currencySymbol: "KSh",
    phonePrefix: "+254",
    phoneDigits: 9,
    networks: [
      { id: "safaricom", name: "Safaricom", short: "SAFARICOM", color: "#1F9D55", logo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Safaricom_logo.svg" },
      { id: "airtel-ke", name: "Airtel Kenya", short: "AIRTEL", color: "#E4002B", logo: "https://upload.wikimedia.org/wikipedia/commons/d/da/Airtel_Africa_logo.svg" },
      { id: "telkom-ke", name: "Telkom Kenya", short: "TELKOM", color: "#B3126E", logo: "https://www.google.com/s2/favicons?domain=telkom.co.ke&sz=128" },
    ],
    distributors: [
      { id: "kplc", name: "Kenya Power", short: "KPLC", color: "#1F7F5C", logo: "https://www.google.com/s2/favicons?domain=kplc.co.ke&sz=128" },
    ],
    minAirtime: 10,
    maxAirtime: 10000,
    quickAirtime: [50, 100, 200, 500, 1000],
    bundles: {
      safaricom: [
        { id: "ke-saf-500mb", size: "500 MB", price: 100, validity: "30 days" },
        { id: "ke-saf-1gb", size: "1 GB", price: 200, validity: "30 days" },
        { id: "ke-saf-2gb", size: "2 GB", price: 350, validity: "30 days" },
        { id: "ke-saf-5gb", size: "5 GB", price: 750, validity: "30 days" },
      ],
      "airtel-ke": [
        { id: "ke-airtel-1gb", size: "1 GB", price: 180, validity: "30 days" },
        { id: "ke-airtel-3gb", size: "3 GB", price: 500, validity: "30 days" },
        { id: "ke-airtel-7gb", size: "7 GB", price: 1000, validity: "30 days" },
      ],
      "telkom-ke": [
        { id: "ke-tel-1gb", size: "1 GB", price: 170, validity: "30 days" },
        { id: "ke-tel-2gb", size: "2 GB", price: 320, validity: "30 days" },
      ],
    },
    minElectricity: 100,
    maxElectricity: 50000,
    quickElectricity: [100, 500, 1000, 2000],
  },
  {
    code: "ZA",
    name: "South Africa",
    flag: "🇿🇦",
    currency: "ZAR",
    currencySymbol: "R",
    phonePrefix: "+27",
    phoneDigits: 9,
    networks: [
      { id: "vodacom", name: "Vodacom", short: "VODACOM", color: "#E60000", logo: "https://upload.wikimedia.org/wikipedia/en/8/8c/Vodacom_Logo_2017.svg" },
      { id: "mtn-za", name: "MTN South Africa", short: "MTN", color: "#FFCC00", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2a/MTN_2022_logo.svg" },
      { id: "cellc", name: "Cell C", short: "CELL C", color: "#0033A0", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b6/Cell_C_New_2024_logo.svg" },
      { id: "telkom-za", name: "Telkom Mobile", short: "TELKOM", color: "#C8102E", logo: "https://www.google.com/s2/favicons?domain=telkom.co.za&sz=128" },
    ],
    distributors: [
      { id: "eskom", name: "Eskom", short: "ESKOM", color: "#1F7F5C", logo: "https://upload.wikimedia.org/wikipedia/en/a/a3/Eskom_%28logo%29.svg" },
      { id: "citypower", name: "City Power (JHB)", short: "CITY POWER", color: "#F59E0B" },
    ],
    minAirtime: 5,
    maxAirtime: 1000,
    quickAirtime: [10, 20, 50, 100, 200],
    bundles: {
      vodacom: [
        { id: "za-vod-1gb", size: "1 GB", price: 99, validity: "30 days" },
        { id: "za-vod-2gb", size: "2 GB", price: 149, validity: "30 days" },
        { id: "za-vod-5gb", size: "5 GB", price: 299, validity: "30 days" },
        { id: "za-vod-10gb", size: "10 GB", price: 499, validity: "30 days" },
      ],
      "mtn-za": [
        { id: "za-mtn-1gb", size: "1 GB", price: 109, validity: "30 days" },
        { id: "za-mtn-2gb", size: "2 GB", price: 169, validity: "30 days" },
        { id: "za-mtn-5gb", size: "5 GB", price: 329, validity: "30 days" },
      ],
      cellc: [
        { id: "za-cellc-1gb", size: "1 GB", price: 85, validity: "30 days" },
        { id: "za-cellc-3gb", size: "3 GB", price: 199, validity: "30 days" },
      ],
      "telkom-za": [
        { id: "za-tel-1gb", size: "1 GB", price: 89, validity: "30 days" },
        { id: "za-tel-2gb", size: "2 GB", price: 149, validity: "30 days" },
      ],
    },
    minElectricity: 50,
    maxElectricity: 10000,
    quickElectricity: [50, 100, 200, 500],
  },
];

export function getCountry(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function getProvider(country: Country, kind: "networks" | "distributors", id: string): Network | undefined {
  return country[kind].find((p) => p.id === id);
}

/** Find a data bundle anywhere in the catalog. */
export function findBundle(country: Country, networkId: string, bundleId: string): Bundle | undefined {
  return country.bundles[networkId]?.find((b) => b.id === bundleId);
}
