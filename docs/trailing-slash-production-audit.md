# URL audit

Date: 2026-09-22T13:41:06.936Z

HTTP environment: https://www.kuem.si. Canonical origin: https://www.kuem.si.

Legacy rows test the directory HTTP redirect only; existing HTML refresh aliases are not HTTP redirects to their canonical targets.

| Type   | Input                                                 | HTTP | Final HTTP URL                                         | Final status | Canonical                                                                 | Loop | Query |
| ------ | ----------------------------------------------------- | ---- | ------------------------------------------------------ | ------------ | ------------------------------------------------------------------------- | ---- | ----- |
| SL     | /                                                     | 200  | /                                                      | 200          | https://www.kuem.si/                                                      | no   | OK    |
| legacy | /about                                                | 404  | /about                                                 | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /case-studies                                         | 404  | /case-studies                                          | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /contact                                              | 404  | /contact                                               | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /devops-platform-engineering                          | 404  | /devops-platform-engineering                           | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| EN     | /en                                                   | 301  | /en/                                                   | 200          | https://www.kuem.si/en/                                                   | no   | OK    |
| legacy | /en/about                                             | 301  | /en/about/                                             | 200          | https://www.kuem.si/en/company/                                           | no   | OK    |
| legacy | /en/case-studies                                      | 301  | /en/case-studies/                                      | 200          | https://www.kuem.si/en/references/                                        | no   | OK    |
| EN     | /en/company                                           | 301  | /en/company/                                           | 200          | https://www.kuem.si/en/company/                                           | no   | OK    |
| EN     | /en/contact                                           | 301  | /en/contact/                                           | 200          | https://www.kuem.si/en/contact/                                           | no   | OK    |
| legacy | /en/industrial-iot                                    | 301  | /en/industrial-iot/                                    | 200          | https://www.kuem.si/en/industrial-iot/                                    | no   | OK    |
| EN     | /en/industries                                        | 301  | /en/industries/                                        | 200          | https://www.kuem.si/en/industries/                                        | no   | OK    |
| EN     | /en/insights                                          | 301  | /en/insights/                                          | 200          | https://www.kuem.si/en/insights/                                          | no   | OK    |
| EN     | /en/kai                                               | 301  | /en/kai/                                               | 200          | https://www.kuem.si/en/kai/                                               | no   | OK    |
| legacy | /en/nexavia-platform                                  | 301  | /en/nexavia-platform/                                  | 200          | https://www.kuem.si/en/nexavia/                                           | no   | OK    |
| EN     | /en/nexavia                                           | 301  | /en/nexavia/                                           | 200          | https://www.kuem.si/en/nexavia/                                           | no   | OK    |
| legacy | /en/partner-program                                   | 301  | /en/partner-program/                                   | 200          | https://www.kuem.si/en/partner-program/                                   | no   | OK    |
| legacy | /en/platform/nexavia                                  | 301  | /en/platform/nexavia/                                  | 200          | https://www.kuem.si/en/nexavia/                                           | no   | OK    |
| EN     | /en/privacy                                           | 301  | /en/privacy/                                           | 200          | https://www.kuem.si/en/privacy/                                           | no   | OK    |
| EN     | /en/references                                        | 301  | /en/references/                                        | 200          | https://www.kuem.si/en/references/                                        | no   | OK    |
| legacy | /en/services                                          | 301  | /en/services/                                          | 200          | https://www.kuem.si/en/solutions/                                         | no   | OK    |
| legacy | /en/services/devops-and-platform-engineering          | 301  | /en/services/devops-and-platform-engineering/          | 200          | https://www.kuem.si/en/solutions/                                         | no   | OK    |
| legacy | /en/services/software-architecture-and-consulting     | 301  | /en/services/software-architecture-and-consulting/     | 200          | https://www.kuem.si/en/solutions/                                         | no   | OK    |
| legacy | /en/services/software-development                     | 301  | /en/services/software-development/                     | 200          | https://www.kuem.si/en/solutions/                                         | no   | OK    |
| EN     | /en/solutions                                         | 301  | /en/solutions/                                         | 200          | https://www.kuem.si/en/solutions                                          | no   | OK    |
| EN     | /en/solutions/advanced-analytics                      | 301  | /en/solutions/advanced-analytics/                      | 200          | https://www.kuem.si/en/solutions/advanced-analytics/                      | no   | OK    |
| EN     | /en/solutions/connectivity                            | 301  | /en/solutions/connectivity/                            | 200          | https://www.kuem.si/en/solutions/connectivity/                            | no   | OK    |
| EN     | /en/solutions/data-acquisition                        | 301  | /en/solutions/data-acquisition/                        | 200          | https://www.kuem.si/en/solutions/data-acquisition/                        | no   | OK    |
| EN     | /en/solutions/data-centers                            | 301  | /en/solutions/data-centers/                            | 200          | https://www.kuem.si/en/solutions/data-centers/                            | no   | OK    |
| EN     | /en/solutions/environmental-monitoring                | 301  | /en/solutions/environmental-monitoring/                | 200          | https://www.kuem.si/en/solutions/environmental-monitoring/                | no   | OK    |
| EN     | /en/solutions/haccp-temperature-monitoring            | 301  | /en/solutions/haccp-temperature-monitoring/            | 200          | https://www.kuem.si/en/solutions/haccp-temperature-monitoring/            | no   | OK    |
| EN     | /en/solutions/integrations                            | 301  | /en/solutions/integrations/                            | 200          | https://www.kuem.si/en/solutions/integrations/                            | no   | OK    |
| EN     | /en/solutions/managed-services                        | 301  | /en/solutions/managed-services/                        | 200          | https://www.kuem.si/en/solutions/managed-services/                        | no   | OK    |
| EN     | /en/solutions/municipal-infrastructure-digitalization | 301  | /en/solutions/municipal-infrastructure-digitalization/ | 200          | https://www.kuem.si/en/solutions/municipal-infrastructure-digitalization/ | no   | OK    |
| legacy | /en/solutions/nexavia                                 | 301  | /en/solutions/nexavia/                                 | 200          | https://www.kuem.si/en/nexavia/                                           | no   | OK    |
| legacy | /en/solutions/nexavia/nexavia-enterprise              | 301  | /en/solutions/nexavia/nexavia-enterprise/              | 200          | https://www.kuem.si/en/nexavia/                                           | no   | OK    |
| EN     | /en/solutions/public-lighting                         | 301  | /en/solutions/public-lighting/                         | 200          | https://www.kuem.si/en/solutions/public-lighting/                         | no   | OK    |
| EN     | /en/solutions/remote-meter-reading                    | 301  | /en/solutions/remote-meter-reading/                    | 200          | https://www.kuem.si/en/solutions/remote-meter-reading/                    | no   | OK    |
| EN     | /en/solutions/schools-and-kindergartens               | 301  | /en/solutions/schools-and-kindergartens/               | 200          | https://www.kuem.si/en/solutions/schools-and-kindergartens/               | no   | OK    |
| EN     | /en/solutions/tourism-camps-marinas                   | 301  | /en/solutions/tourism-camps-marinas/                   | 200          | https://www.kuem.si/en/solutions/tourism-camps-marinas/                   | no   | OK    |
| EN     | /en/solutions/traffic-and-mobility                    | 301  | /en/solutions/traffic-and-mobility/                    | 200          | https://www.kuem.si/en/solutions/traffic-and-mobility/                    | no   | OK    |
| EN     | /en/solutions/waste                                   | 301  | /en/solutions/waste/                                   | 200          | https://www.kuem.si/en/solutions/waste/                                   | no   | OK    |
| legacy | /en/utilities                                         | 301  | /en/utilities/                                         | 200          | https://www.kuem.si/en/utilities/                                         | no   | OK    |
| legacy | /industrial-iot                                       | 301  | /industrial-iot/                                       | 200          | https://www.kuem.si/industrial-iot/                                       | no   | OK    |
| SL     | /kai                                                  | 301  | /kai/                                                  | 200          | https://www.kuem.si/kai/                                                  | no   | OK    |
| SL     | /kontakt                                              | 301  | /kontakt/                                              | 200          | https://www.kuem.si/kontakt/                                              | no   | OK    |
| legacy | /nexavia-platform                                     | 301  | /nexavia-platform/                                     | 200          | https://www.kuem.si/nexavia-platform/                                     | no   | OK    |
| SL     | /nexavia                                              | 301  | /nexavia/                                              | 200          | https://www.kuem.si/nexavia/                                              | no   | OK    |
| SL     | /o-nas                                                | 301  | /o-nas/                                                | 200          | https://www.kuem.si/o-nas/                                                | no   | OK    |
| legacy | /o-podjetju                                           | 404  | /o-podjetju                                            | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| SL     | /panoge                                               | 301  | /panoge/                                               | 200          | https://www.kuem.si/panoge/                                               | no   | OK    |
| legacy | /partner-program                                      | 301  | /partner-program/                                      | 200          | https://www.kuem.si/partner-program/                                      | no   | OK    |
| legacy | /platforma/nexavia                                    | 404  | /platforma/nexavia                                     | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /privacy                                              | 404  | /privacy                                               | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| SL     | /reference                                            | 301  | /reference/                                            | 200          | https://www.kuem.si/reference/                                            | no   | OK    |
| legacy | /references                                           | 404  | /references                                            | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| SL     | /resitve                                              | 301  | /resitve/                                              | 200          | https://www.kuem.si/resitve                                               | no   | OK    |
| SL     | /resitve/daljinsko-odcitavanje-stevcev                | 301  | /resitve/daljinsko-odcitavanje-stevcev/                | 200          | https://www.kuem.si/resitve/daljinsko-odcitavanje-stevcev/                | no   | OK    |
| SL     | /resitve/data-centri                                  | 301  | /resitve/data-centri/                                  | 200          | https://www.kuem.si/resitve/data-centri/                                  | no   | OK    |
| SL     | /resitve/digitalizacija-obcinske-infrastrukture       | 301  | /resitve/digitalizacija-obcinske-infrastrukture/       | 200          | https://www.kuem.si/resitve/digitalizacija-obcinske-infrastrukture/       | no   | OK    |
| SL     | /resitve/haccp-temperaturni-monitoring                | 301  | /resitve/haccp-temperaturni-monitoring/                | 200          | https://www.kuem.si/resitve/haccp-temperaturni-monitoring/                | no   | OK    |
| SL     | /resitve/integracije                                  | 301  | /resitve/integracije/                                  | 200          | https://www.kuem.si/resitve/integracije/                                  | no   | OK    |
| SL     | /resitve/javna-razsvetljava                           | 301  | /resitve/javna-razsvetljava/                           | 200          | https://www.kuem.si/resitve/javna-razsvetljava/                           | no   | OK    |
| SL     | /resitve/napredna-analitika                           | 301  | /resitve/napredna-analitika/                           | 200          | https://www.kuem.si/resitve/napredna-analitika/                           | no   | OK    |
| legacy | /resitve/nexavia                                      | 404  | /resitve/nexavia                                       | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /resitve/nexavia/nexavia-enterprise                   | 404  | /resitve/nexavia/nexavia-enterprise                    | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| SL     | /resitve/odpadki                                      | 301  | /resitve/odpadki/                                      | 200          | https://www.kuem.si/resitve/odpadki/                                      | no   | OK    |
| SL     | /resitve/okoljski-monitoring                          | 301  | /resitve/okoljski-monitoring/                          | 200          | https://www.kuem.si/resitve/okoljski-monitoring/                          | no   | OK    |
| SL     | /resitve/povezljivost                                 | 301  | /resitve/povezljivost/                                 | 200          | https://www.kuem.si/resitve/povezljivost/                                 | no   | OK    |
| SL     | /resitve/promet-in-mobilnost                          | 301  | /resitve/promet-in-mobilnost/                          | 200          | https://www.kuem.si/resitve/promet-in-mobilnost/                          | no   | OK    |
| SL     | /resitve/sole-in-vrtci                                | 301  | /resitve/sole-in-vrtci/                                | 200          | https://www.kuem.si/resitve/sole-in-vrtci/                                | no   | OK    |
| SL     | /resitve/turizem-kampi-marine                         | 301  | /resitve/turizem-kampi-marine/                         | 200          | https://www.kuem.si/resitve/turizem-kampi-marine/                         | no   | OK    |
| SL     | /resitve/upravljane-storitve                          | 301  | /resitve/upravljane-storitve/                          | 200          | https://www.kuem.si/resitve/upravljane-storitve/                          | no   | OK    |
| SL     | /resitve/zajem-podatkov                               | 301  | /resitve/zajem-podatkov/                               | 200          | https://www.kuem.si/resitve/zajem-podatkov/                               | no   | OK    |
| legacy | /sl                                                   | 404  | /sl                                                    | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/about                                             | 404  | /sl/about                                              | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/case-studies                                      | 404  | /sl/case-studies                                       | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/contact                                           | 404  | /sl/contact                                            | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/industrial-iot                                    | 404  | /sl/industrial-iot                                     | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/kontakt                                           | 404  | /sl/kontakt                                            | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/nexavia-platform                                  | 404  | /sl/nexavia-platform                                   | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/o-nas                                             | 404  | /sl/o-nas                                              | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/partner-program                                   | 404  | /sl/partner-program                                    | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/platforma/nexavia                                 | 404  | /sl/platforma/nexavia                                  | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/privacy                                           | 404  | /sl/privacy                                            | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/reference                                         | 404  | /sl/reference                                          | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/resitve                                           | 404  | /sl/resitve                                            | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/resitve/daljinsko-odcitavanje-stevcev             | 404  | /sl/resitve/daljinsko-odcitavanje-stevcev              | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/resitve/data-centri                               | 404  | /sl/resitve/data-centri                                | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/resitve/digitalizacija-obcinske-infrastrukture    | 404  | /sl/resitve/digitalizacija-obcinske-infrastrukture     | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/resitve/haccp-temperaturni-monitoring             | 404  | /sl/resitve/haccp-temperaturni-monitoring              | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/resitve/javna-razsvetljava                        | 404  | /sl/resitve/javna-razsvetljava                         | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/resitve/odpadki                                   | 404  | /sl/resitve/odpadki                                    | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/resitve/okoljski-monitoring                       | 404  | /sl/resitve/okoljski-monitoring                        | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/resitve/promet-in-mobilnost                       | 404  | /sl/resitve/promet-in-mobilnost                        | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/resitve/sole-in-vrtci                             | 404  | /sl/resitve/sole-in-vrtci                              | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/resitve/turizem-kampi-marine                      | 404  | /sl/resitve/turizem-kampi-marine                       | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /sl/utilities                                         | 404  | /sl/utilities                                          | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /software-architecture-consulting                     | 404  | /software-architecture-consulting                      | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /software-design-development                          | 404  | /software-design-development                           | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /storitve                                             | 404  | /storitve                                              | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /storitve/arhitektura-programske-opreme-in-svetovanje | 404  | /storitve/arhitektura-programske-opreme-in-svetovanje  | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /storitve/devops-in-platform-engineering              | 404  | /storitve/devops-in-platform-engineering               | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /storitve/razvoj-programske-opreme                    | 404  | /storitve/razvoj-programske-opreme                     | 404          | https://www.kuem.si/404/                                                  | no   | FAIL  |
| legacy | /utilities                                            | 301  | /utilities/                                            | 200          | https://www.kuem.si/utilities/                                            | no   | OK    |
| SL     | /vpogledi                                             | 301  | /vpogledi/                                             | 200          | https://www.kuem.si/vpogledi/                                             | no   | OK    |
| SL     | /zasebnost                                            | 301  | /zasebnost/                                            | 200          | https://www.kuem.si/zasebnost/                                            | no   | OK    |

Errors (129):

- https://www.kuem.si/about: 404 -> /about -> 404
- https://www.kuem.si/about/: live canonical https://www.kuem.si/404/
- /about/: query not preserved
- https://www.kuem.si/case-studies: 404 -> /case-studies -> 404
- https://www.kuem.si/case-studies/: live canonical https://www.kuem.si/404/
- /case-studies/: query not preserved
- https://www.kuem.si/contact: 404 -> /contact -> 404
- https://www.kuem.si/contact/: live canonical https://www.kuem.si/404/
- /contact/: query not preserved
- https://www.kuem.si/devops-platform-engineering: 404 -> /devops-platform-engineering -> 404
- https://www.kuem.si/devops-platform-engineering/: live canonical https://www.kuem.si/404/
- /devops-platform-engineering/: query not preserved
- https://www.kuem.si/en/industrial-iot/: live canonical https://www.kuem.si/en/industrial-iot/
- https://www.kuem.si/en/partner-program/: live canonical https://www.kuem.si/en/partner-program/
- https://www.kuem.si/en/solutions/: live canonical https://www.kuem.si/en/solutions
- https://www.kuem.si/en/utilities/: live canonical https://www.kuem.si/en/utilities/
- https://www.kuem.si/industrial-iot/: live canonical https://www.kuem.si/industrial-iot/
- https://www.kuem.si/nexavia-platform/: live canonical https://www.kuem.si/nexavia-platform/
- https://www.kuem.si/o-podjetju: 404 -> /o-podjetju -> 404
- https://www.kuem.si/o-podjetju/: live canonical https://www.kuem.si/404/
- /o-podjetju/: query not preserved
- https://www.kuem.si/partner-program/: live canonical https://www.kuem.si/partner-program/
- https://www.kuem.si/platforma/nexavia: 404 -> /platforma/nexavia -> 404
- https://www.kuem.si/platforma/nexavia/: live canonical https://www.kuem.si/404/
- /platforma/nexavia/: query not preserved
- https://www.kuem.si/privacy: 404 -> /privacy -> 404
- https://www.kuem.si/privacy/: live canonical https://www.kuem.si/404/
- /privacy/: query not preserved
- https://www.kuem.si/references: 404 -> /references -> 404
- https://www.kuem.si/references/: live canonical https://www.kuem.si/404/
- /references/: query not preserved
- https://www.kuem.si/resitve/: live canonical https://www.kuem.si/resitve
- https://www.kuem.si/resitve/nexavia: 404 -> /resitve/nexavia -> 404
- https://www.kuem.si/resitve/nexavia/: live canonical https://www.kuem.si/404/
- /resitve/nexavia/: query not preserved
- https://www.kuem.si/resitve/nexavia/nexavia-enterprise: 404 -> /resitve/nexavia/nexavia-enterprise -> 404
- https://www.kuem.si/resitve/nexavia/nexavia-enterprise/: live canonical https://www.kuem.si/404/
- /resitve/nexavia/nexavia-enterprise/: query not preserved
- https://www.kuem.si/sl: 404 -> /sl -> 404
- https://www.kuem.si/sl/: live canonical https://www.kuem.si/404/
- /sl/: query not preserved
- https://www.kuem.si/sl/about: 404 -> /sl/about -> 404
- https://www.kuem.si/sl/about/: live canonical https://www.kuem.si/404/
- /sl/about/: query not preserved
- https://www.kuem.si/sl/case-studies: 404 -> /sl/case-studies -> 404
- https://www.kuem.si/sl/case-studies/: live canonical https://www.kuem.si/404/
- /sl/case-studies/: query not preserved
- https://www.kuem.si/sl/contact: 404 -> /sl/contact -> 404
- https://www.kuem.si/sl/contact/: live canonical https://www.kuem.si/404/
- /sl/contact/: query not preserved
- https://www.kuem.si/sl/industrial-iot: 404 -> /sl/industrial-iot -> 404
- https://www.kuem.si/sl/industrial-iot/: live canonical https://www.kuem.si/404/
- /sl/industrial-iot/: query not preserved
- https://www.kuem.si/sl/kontakt: 404 -> /sl/kontakt -> 404
- https://www.kuem.si/sl/kontakt/: live canonical https://www.kuem.si/404/
- /sl/kontakt/: query not preserved
- https://www.kuem.si/sl/nexavia-platform: 404 -> /sl/nexavia-platform -> 404
- https://www.kuem.si/sl/nexavia-platform/: live canonical https://www.kuem.si/404/
- /sl/nexavia-platform/: query not preserved
- https://www.kuem.si/sl/o-nas: 404 -> /sl/o-nas -> 404
- https://www.kuem.si/sl/o-nas/: live canonical https://www.kuem.si/404/
- /sl/o-nas/: query not preserved
- https://www.kuem.si/sl/partner-program: 404 -> /sl/partner-program -> 404
- https://www.kuem.si/sl/partner-program/: live canonical https://www.kuem.si/404/
- /sl/partner-program/: query not preserved
- https://www.kuem.si/sl/platforma/nexavia: 404 -> /sl/platforma/nexavia -> 404
- https://www.kuem.si/sl/platforma/nexavia/: live canonical https://www.kuem.si/404/
- /sl/platforma/nexavia/: query not preserved
- https://www.kuem.si/sl/privacy: 404 -> /sl/privacy -> 404
- https://www.kuem.si/sl/privacy/: live canonical https://www.kuem.si/404/
- /sl/privacy/: query not preserved
- https://www.kuem.si/sl/reference: 404 -> /sl/reference -> 404
- https://www.kuem.si/sl/reference/: live canonical https://www.kuem.si/404/
- /sl/reference/: query not preserved
- https://www.kuem.si/sl/resitve: 404 -> /sl/resitve -> 404
- https://www.kuem.si/sl/resitve/: live canonical https://www.kuem.si/404/
- /sl/resitve/: query not preserved
- https://www.kuem.si/sl/resitve/daljinsko-odcitavanje-stevcev: 404 -> /sl/resitve/daljinsko-odcitavanje-stevcev -> 404
- https://www.kuem.si/sl/resitve/daljinsko-odcitavanje-stevcev/: live canonical https://www.kuem.si/404/
- /sl/resitve/daljinsko-odcitavanje-stevcev/: query not preserved
- https://www.kuem.si/sl/resitve/data-centri: 404 -> /sl/resitve/data-centri -> 404
- https://www.kuem.si/sl/resitve/data-centri/: live canonical https://www.kuem.si/404/
- /sl/resitve/data-centri/: query not preserved
- https://www.kuem.si/sl/resitve/digitalizacija-obcinske-infrastrukture: 404 -> /sl/resitve/digitalizacija-obcinske-infrastrukture -> 404
- https://www.kuem.si/sl/resitve/digitalizacija-obcinske-infrastrukture/: live canonical https://www.kuem.si/404/
- /sl/resitve/digitalizacija-obcinske-infrastrukture/: query not preserved
- https://www.kuem.si/sl/resitve/haccp-temperaturni-monitoring: 404 -> /sl/resitve/haccp-temperaturni-monitoring -> 404
- https://www.kuem.si/sl/resitve/haccp-temperaturni-monitoring/: live canonical https://www.kuem.si/404/
- /sl/resitve/haccp-temperaturni-monitoring/: query not preserved
- https://www.kuem.si/sl/resitve/javna-razsvetljava: 404 -> /sl/resitve/javna-razsvetljava -> 404
- https://www.kuem.si/sl/resitve/javna-razsvetljava/: live canonical https://www.kuem.si/404/
- /sl/resitve/javna-razsvetljava/: query not preserved
- https://www.kuem.si/sl/resitve/odpadki: 404 -> /sl/resitve/odpadki -> 404
- https://www.kuem.si/sl/resitve/odpadki/: live canonical https://www.kuem.si/404/
- /sl/resitve/odpadki/: query not preserved
- https://www.kuem.si/sl/resitve/okoljski-monitoring: 404 -> /sl/resitve/okoljski-monitoring -> 404
- https://www.kuem.si/sl/resitve/okoljski-monitoring/: live canonical https://www.kuem.si/404/
- /sl/resitve/okoljski-monitoring/: query not preserved
- https://www.kuem.si/sl/resitve/promet-in-mobilnost: 404 -> /sl/resitve/promet-in-mobilnost -> 404
- https://www.kuem.si/sl/resitve/promet-in-mobilnost/: live canonical https://www.kuem.si/404/
- /sl/resitve/promet-in-mobilnost/: query not preserved
- https://www.kuem.si/sl/resitve/sole-in-vrtci: 404 -> /sl/resitve/sole-in-vrtci -> 404
- https://www.kuem.si/sl/resitve/sole-in-vrtci/: live canonical https://www.kuem.si/404/
- /sl/resitve/sole-in-vrtci/: query not preserved
- https://www.kuem.si/sl/resitve/turizem-kampi-marine: 404 -> /sl/resitve/turizem-kampi-marine -> 404
- https://www.kuem.si/sl/resitve/turizem-kampi-marine/: live canonical https://www.kuem.si/404/
- /sl/resitve/turizem-kampi-marine/: query not preserved
- https://www.kuem.si/sl/utilities: 404 -> /sl/utilities -> 404
- https://www.kuem.si/sl/utilities/: live canonical https://www.kuem.si/404/
- /sl/utilities/: query not preserved
- https://www.kuem.si/software-architecture-consulting: 404 -> /software-architecture-consulting -> 404
- https://www.kuem.si/software-architecture-consulting/: live canonical https://www.kuem.si/404/
- /software-architecture-consulting/: query not preserved
- https://www.kuem.si/software-design-development: 404 -> /software-design-development -> 404
- https://www.kuem.si/software-design-development/: live canonical https://www.kuem.si/404/
- /software-design-development/: query not preserved
- https://www.kuem.si/storitve: 404 -> /storitve -> 404
- https://www.kuem.si/storitve/: live canonical https://www.kuem.si/404/
- /storitve/: query not preserved
- https://www.kuem.si/storitve/arhitektura-programske-opreme-in-svetovanje: 404 -> /storitve/arhitektura-programske-opreme-in-svetovanje -> 404
- https://www.kuem.si/storitve/arhitektura-programske-opreme-in-svetovanje/: live canonical https://www.kuem.si/404/
- /storitve/arhitektura-programske-opreme-in-svetovanje/: query not preserved
- https://www.kuem.si/storitve/devops-in-platform-engineering: 404 -> /storitve/devops-in-platform-engineering -> 404
- https://www.kuem.si/storitve/devops-in-platform-engineering/: live canonical https://www.kuem.si/404/
- /storitve/devops-in-platform-engineering/: query not preserved
- https://www.kuem.si/storitve/razvoj-programske-opreme: 404 -> /storitve/razvoj-programske-opreme -> 404
- https://www.kuem.si/storitve/razvoj-programske-opreme/: live canonical https://www.kuem.si/404/
- /storitve/razvoj-programske-opreme/: query not preserved
- https://www.kuem.si/utilities/: live canonical https://www.kuem.si/utilities/
