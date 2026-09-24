# URL audit

Date: 2026-09-22T13:45:17.951Z

HTTP environment: http://127.0.0.1:4335. Canonical origin: https://www.kuem.si.

Legacy rows test the directory HTTP redirect only; existing HTML refresh aliases are not HTTP redirects to their canonical targets.

| Type | Input                                                 | HTTP | Final HTTP URL                                         | Final status | Canonical                                                                 | Loop | Query |
| ---- | ----------------------------------------------------- | ---- | ------------------------------------------------------ | ------------ | ------------------------------------------------------------------------- | ---- | ----- |
| SL   | /                                                     | 200  | /                                                      | 200          | https://www.kuem.si/                                                      | no   | OK    |
| EN   | /en                                                   | 301  | /en/                                                   | 200          | https://www.kuem.si/en/                                                   | no   | OK    |
| EN   | /en/company                                           | 301  | /en/company/                                           | 200          | https://www.kuem.si/en/company/                                           | no   | OK    |
| EN   | /en/contact                                           | 301  | /en/contact/                                           | 200          | https://www.kuem.si/en/contact/                                           | no   | OK    |
| EN   | /en/industries                                        | 301  | /en/industries/                                        | 200          | https://www.kuem.si/en/industries/                                        | no   | OK    |
| EN   | /en/insights                                          | 301  | /en/insights/                                          | 200          | https://www.kuem.si/en/insights/                                          | no   | OK    |
| EN   | /en/kai                                               | 301  | /en/kai/                                               | 200          | https://www.kuem.si/en/kai/                                               | no   | OK    |
| EN   | /en/nexavia                                           | 301  | /en/nexavia/                                           | 200          | https://www.kuem.si/en/nexavia/                                           | no   | OK    |
| EN   | /en/privacy                                           | 301  | /en/privacy/                                           | 200          | https://www.kuem.si/en/privacy/                                           | no   | OK    |
| EN   | /en/references                                        | 301  | /en/references/                                        | 200          | https://www.kuem.si/en/references/                                        | no   | OK    |
| EN   | /en/solutions                                         | 301  | /en/solutions/                                         | 200          | https://www.kuem.si/en/solutions/                                         | no   | OK    |
| EN   | /en/solutions/advanced-analytics                      | 301  | /en/solutions/advanced-analytics/                      | 200          | https://www.kuem.si/en/solutions/advanced-analytics/                      | no   | OK    |
| EN   | /en/solutions/connectivity                            | 301  | /en/solutions/connectivity/                            | 200          | https://www.kuem.si/en/solutions/connectivity/                            | no   | OK    |
| EN   | /en/solutions/data-acquisition                        | 301  | /en/solutions/data-acquisition/                        | 200          | https://www.kuem.si/en/solutions/data-acquisition/                        | no   | OK    |
| EN   | /en/solutions/data-centers                            | 301  | /en/solutions/data-centers/                            | 200          | https://www.kuem.si/en/solutions/data-centers/                            | no   | OK    |
| EN   | /en/solutions/environmental-monitoring                | 301  | /en/solutions/environmental-monitoring/                | 200          | https://www.kuem.si/en/solutions/environmental-monitoring/                | no   | OK    |
| EN   | /en/solutions/haccp-temperature-monitoring            | 301  | /en/solutions/haccp-temperature-monitoring/            | 200          | https://www.kuem.si/en/solutions/haccp-temperature-monitoring/            | no   | OK    |
| EN   | /en/solutions/integrations                            | 301  | /en/solutions/integrations/                            | 200          | https://www.kuem.si/en/solutions/integrations/                            | no   | OK    |
| EN   | /en/solutions/managed-services                        | 301  | /en/solutions/managed-services/                        | 200          | https://www.kuem.si/en/solutions/managed-services/                        | no   | OK    |
| EN   | /en/solutions/municipal-infrastructure-digitalization | 301  | /en/solutions/municipal-infrastructure-digitalization/ | 200          | https://www.kuem.si/en/solutions/municipal-infrastructure-digitalization/ | no   | OK    |
| EN   | /en/solutions/public-lighting                         | 301  | /en/solutions/public-lighting/                         | 200          | https://www.kuem.si/en/solutions/public-lighting/                         | no   | OK    |
| EN   | /en/solutions/remote-meter-reading                    | 301  | /en/solutions/remote-meter-reading/                    | 200          | https://www.kuem.si/en/solutions/remote-meter-reading/                    | no   | OK    |
| EN   | /en/solutions/schools-and-kindergartens               | 301  | /en/solutions/schools-and-kindergartens/               | 200          | https://www.kuem.si/en/solutions/schools-and-kindergartens/               | no   | OK    |
| EN   | /en/solutions/tourism-camps-marinas                   | 301  | /en/solutions/tourism-camps-marinas/                   | 200          | https://www.kuem.si/en/solutions/tourism-camps-marinas/                   | no   | OK    |
| EN   | /en/solutions/traffic-and-mobility                    | 301  | /en/solutions/traffic-and-mobility/                    | 200          | https://www.kuem.si/en/solutions/traffic-and-mobility/                    | no   | OK    |
| EN   | /en/solutions/waste                                   | 301  | /en/solutions/waste/                                   | 200          | https://www.kuem.si/en/solutions/waste/                                   | no   | OK    |
| SL   | /kai                                                  | 301  | /kai/                                                  | 200          | https://www.kuem.si/kai/                                                  | no   | OK    |
| SL   | /kontakt                                              | 301  | /kontakt/                                              | 200          | https://www.kuem.si/kontakt/                                              | no   | OK    |
| SL   | /nexavia                                              | 301  | /nexavia/                                              | 200          | https://www.kuem.si/nexavia/                                              | no   | OK    |
| SL   | /o-nas                                                | 301  | /o-nas/                                                | 200          | https://www.kuem.si/o-nas/                                                | no   | OK    |
| SL   | /panoge                                               | 301  | /panoge/                                               | 200          | https://www.kuem.si/panoge/                                               | no   | OK    |
| SL   | /reference                                            | 301  | /reference/                                            | 200          | https://www.kuem.si/reference/                                            | no   | OK    |
| SL   | /resitve                                              | 301  | /resitve/                                              | 200          | https://www.kuem.si/resitve/                                              | no   | OK    |
| SL   | /resitve/daljinsko-odcitavanje-stevcev                | 301  | /resitve/daljinsko-odcitavanje-stevcev/                | 200          | https://www.kuem.si/resitve/daljinsko-odcitavanje-stevcev/                | no   | OK    |
| SL   | /resitve/data-centri                                  | 301  | /resitve/data-centri/                                  | 200          | https://www.kuem.si/resitve/data-centri/                                  | no   | OK    |
| SL   | /resitve/digitalizacija-obcinske-infrastrukture       | 301  | /resitve/digitalizacija-obcinske-infrastrukture/       | 200          | https://www.kuem.si/resitve/digitalizacija-obcinske-infrastrukture/       | no   | OK    |
| SL   | /resitve/haccp-temperaturni-monitoring                | 301  | /resitve/haccp-temperaturni-monitoring/                | 200          | https://www.kuem.si/resitve/haccp-temperaturni-monitoring/                | no   | OK    |
| SL   | /resitve/integracije                                  | 301  | /resitve/integracije/                                  | 200          | https://www.kuem.si/resitve/integracije/                                  | no   | OK    |
| SL   | /resitve/javna-razsvetljava                           | 301  | /resitve/javna-razsvetljava/                           | 200          | https://www.kuem.si/resitve/javna-razsvetljava/                           | no   | OK    |
| SL   | /resitve/napredna-analitika                           | 301  | /resitve/napredna-analitika/                           | 200          | https://www.kuem.si/resitve/napredna-analitika/                           | no   | OK    |
| SL   | /resitve/odpadki                                      | 301  | /resitve/odpadki/                                      | 200          | https://www.kuem.si/resitve/odpadki/                                      | no   | OK    |
| SL   | /resitve/okoljski-monitoring                          | 301  | /resitve/okoljski-monitoring/                          | 200          | https://www.kuem.si/resitve/okoljski-monitoring/                          | no   | OK    |
| SL   | /resitve/povezljivost                                 | 301  | /resitve/povezljivost/                                 | 200          | https://www.kuem.si/resitve/povezljivost/                                 | no   | OK    |
| SL   | /resitve/promet-in-mobilnost                          | 301  | /resitve/promet-in-mobilnost/                          | 200          | https://www.kuem.si/resitve/promet-in-mobilnost/                          | no   | OK    |
| SL   | /resitve/sole-in-vrtci                                | 301  | /resitve/sole-in-vrtci/                                | 200          | https://www.kuem.si/resitve/sole-in-vrtci/                                | no   | OK    |
| SL   | /resitve/turizem-kampi-marine                         | 301  | /resitve/turizem-kampi-marine/                         | 200          | https://www.kuem.si/resitve/turizem-kampi-marine/                         | no   | OK    |
| SL   | /resitve/upravljane-storitve                          | 301  | /resitve/upravljane-storitve/                          | 200          | https://www.kuem.si/resitve/upravljane-storitve/                          | no   | OK    |
| SL   | /resitve/zajem-podatkov                               | 301  | /resitve/zajem-podatkov/                               | 200          | https://www.kuem.si/resitve/zajem-podatkov/                               | no   | OK    |
| SL   | /vpogledi                                             | 301  | /vpogledi/                                             | 200          | https://www.kuem.si/vpogledi/                                             | no   | OK    |
| SL   | /zasebnost                                            | 301  | /zasebnost/                                            | 200          | https://www.kuem.si/zasebnost/                                            | no   | OK    |

Errors (0):
None.
