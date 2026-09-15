/*
 * Presentation helpers for the player cards.
 *
 * No ratings are computed here. Every value shown on a card is a raw column
 * from `backend/models.py` (potential_goals_per_game, physicality, age,
 * nationality). The only thing derived is the card's colour, which is just a
 * visual restatement of `physicality`.
 */

/** Card tier maps directly onto physicality (1-3), as a spray colour. */
export const tier = (physicality) => {
  if (physicality >= 3) return "acid";
  if (physicality === 2) return "cyan";
  return "magenta";
};

/* Nationality -> ISO 3166-1 alpha-2, from which the flag emoji is derived by
   codepoint arithmetic. A map of codes stays far shorter than a map of emoji,
   and football-data.org reports nationalities as full English country names. */
const COUNTRY_CODES = {
  Albania: "AL", Algeria: "DZ", Angola: "AO", Argentina: "AR", Armenia: "AM",
  Australia: "AU", Austria: "AT", Belgium: "BE", Benin: "BJ",
  "Bosnia and Herzegovina": "BA", Brazil: "BR", Bulgaria: "BG",
  "Burkina Faso": "BF", Cameroon: "CM", Canada: "CA", "Cape Verde": "CV",
  Chile: "CL", China: "CN", Colombia: "CO", "Costa Rica": "CR",
  "Cote d'Ivoire": "CI", "Ivory Coast": "CI", Croatia: "HR", Curacao: "CW",
  Czechia: "CZ", "Czech Republic": "CZ", Denmark: "DK", "DR Congo": "CD",
  Ecuador: "EC", Egypt: "EG", Estonia: "EE", Finland: "FI", France: "FR",
  Gabon: "GA", Gambia: "GM", Georgia: "GE", Germany: "DE", Ghana: "GH",
  Greece: "GR", Guinea: "GN", "Guinea-Bissau": "GW", Honduras: "HN",
  Hungary: "HU", Iceland: "IS", Iran: "IR", Iraq: "IQ", Ireland: "IE",
  Israel: "IL", Italy: "IT", Jamaica: "JM", Japan: "JP", Kosovo: "XK",
  Latvia: "LV", Lithuania: "LT", Luxembourg: "LU", Mali: "ML", Mexico: "MX",
  Montenegro: "ME", Morocco: "MA", Netherlands: "NL", "New Zealand": "NZ",
  Nigeria: "NG", "North Macedonia": "MK", Norway: "NO", Panama: "PA",
  Paraguay: "PY", Peru: "PE", Philippines: "PH", Poland: "PL",
  Portugal: "PT", Romania: "RO", Russia: "RU", "Saudi Arabia": "SA",
  Senegal: "SN", Serbia: "RS", Slovakia: "SK", Slovenia: "SI",
  "South Africa": "ZA", "South Korea": "KR", "Korea Republic": "KR",
  Spain: "ES", Sweden: "SE", Switzerland: "CH", Syria: "SY", Togo: "TG",
  Tunisia: "TN", Turkey: "TR", "Turkiye": "TR", Ukraine: "UA",
  "United States": "US", USA: "US", Uruguay: "UY", Uzbekistan: "UZ",
  Venezuela: "VE", Zambia: "ZM", Zimbabwe: "ZW",
};

/* The Home Nations have subdivision flags rather than country-code ones. */
const SUBDIVISION_FLAGS = {
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  "Northern Ireland": "🇬🇧",
};

const REGIONAL_INDICATOR_A = 0x1f1e6;

const flagFromCode = (code) =>
  String.fromCodePoint(
    ...[...code].map(
      (letter) => REGIONAL_INDICATOR_A + letter.charCodeAt(0) - 65,
    ),
  );

export const flagFor = (nationality) => {
  if (!nationality) return "🏳️";
  if (SUBDIVISION_FLAGS[nationality]) return SUBDIVISION_FLAGS[nationality];

  const code = COUNTRY_CODES[nationality];
  return code ? flagFromCode(code) : "🏳️";
};

export const cardName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/);
  return (parts.length > 1 ? parts.slice(1).join(" ") : parts[0] ?? "").toUpperCase();
};
