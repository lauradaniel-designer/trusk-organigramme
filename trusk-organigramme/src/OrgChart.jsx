import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from "react";
import {
  Search, Plus, Settings2, Lock, Unlock, Download, Upload, X, Trash2,
  Pencil, ChevronDown, ChevronRight, ChevronUp, Maximize2, ZoomIn, ZoomOut,
  Users, UserPlus, MoreVertical, CornerUpLeft, AlertCircle, Linkedin, Mail, Phone, LayoutGrid, List, Palette, AlertTriangle,
} from "lucide-react";
import Papa from "papaparse";
/* saveState est renommé : le composant a déjà un état local du même nom */
import { loadState, saveState as persistState, onAuth, signIn, signOut } from "./store";

/* ------------------------------------------------------------------ *
 *  THEME — tout ce qui est modifiable depuis le panneau Thème
 * ------------------------------------------------------------------ */

const FONTS = {
  poppins: { label: "Poppins", stack: "'Poppins', system-ui, sans-serif" },
  grotesk: { label: "Space Grotesk", stack: "'Space Grotesk', system-ui, sans-serif" },
  inter: { label: "Inter", stack: "'Inter', system-ui, sans-serif" },
  plex: { label: "IBM Plex Sans", stack: "'IBM Plex Sans', system-ui, sans-serif" },
};

/* Logo TRUSK — fichier statique servi depuis /public */
const DEFAULT_LOGO = "/logo-trusk.webp";

const DEFAULT_THEME = {
  orgName: "TRUSK",
  logo: DEFAULT_LOGO,
  tagline: "Découvrez qui sont les talents qui composent #LaMeute",
  accent: "#1B3BF5",
  ring: "#8B3DD9",
  ink: "#0B1220",
  canvas: "#FFFFFF",
  surface: "#FFFFFF",
  line: "#E4E7EF",
  font: "poppins",
  emailDomain: "trusk.com",
  updatedAt: "21/08/26",
  updatedBy: "Sonali",
  radius: 14,
  uppercaseRoles: true,
  showPhotos: true,
  sideband: true,
};

const DEFAULT_DEPARTMENTS = [
  { id: "support", name: "Support", color: "#3D5AFE" },
  { id: "sales", name: "Sales & Account", color: "#E0245E" },
  { id: "tech", name: "Produit & Tech", color: "#0FA3B1" },
  { id: "produit", name: "Produit", color: "#7A5CF0" },
  { id: "roi", name: "ROI", color: "#12A150" },
  { id: "transport", name: "Transport", color: "#F2760C" },
  { id: "dispatch", name: "Dispatch", color: "#B04AE0" },
  { id: "cc", name: "Customer Care", color: "#0EA5E9" },
  { id: "log", name: "Logistique", color: "#64748B" },
  { id: "ikea", name: "Team Ikea", color: "#0058A3" },
];




/* ------------------------------------------------------------------ *
 *  DONNÉES — reprises du PDF « Organigramme TRUSK » (maj 10/11/25)
 *  type: "person" | "group" ; vacant: poste en cours de recrutement
 * ------------------------------------------------------------------ */

const SEED = [
  ["thomas-effantin", "Thomas Effantin", "Président & Co-Fondateur", "support", null, { linkedin: "https://www.linkedin.com/in/thomas-effantin-3ba6053a/", email: "thomas@trusk.com" }],
  ["sarah-gimenez-fauvety", "Sarah Gimenez Fauvety", "Directrice Générale", "support", "thomas-effantin", { linkedin: "https://www.linkedin.com/in/sarah-gimenez-fauvety-01689b40/", email: "sarah@trusk.com", comex: true }],
  ["site-gennevilliers", "Gennevilliers", "", "log", "sarah-gimenez-fauvety", { group: true }],
  ["axel-dellis", "Axel Dellis", "Resp. d'Exploitation", "log", "site-gennevilliers", { linkedin: "https://www.linkedin.com/in/axel-dellis-92aa86271/", email: "axel.dellis@trusk.com" }],
  ["hakim-azzouz", "Hakim Azzouz", "Agent Logistique", "log", "axel-dellis", { email: "hakim.azzouz@trusk.com" }],
  ["abdelah-belgaid", "Abdelah Belgaid", "Chef d'Équipe (nuit)", "log", "axel-dellis", { email: "abdelah.belgaid@trusk.com" }],
  ["hassan-errais", "Hassan Errais", "Cariste", "log", "axel-dellis", { linkedin: "https://www.linkedin.com/in/hassan-errais-471398367/", email: "hassan.errais@trusk.com" }],
  ["idir-lourci", "Idir Lourci", "Chef d'Équipe (jour)", "log", "axel-dellis", { email: "idir.lourci@trusk.com" }],
  ["aly-soumare", "Aly Soumare", "Agent Logistique", "log", "axel-dellis", { email: "aly.soumare@trusk.com" }],
  ["mohamed-soumare", "Mohamed Soumare", "Cariste", "log", "axel-dellis", { linkedin: "https://www.linkedin.com/in/mohamed-soumare-a6499420a/", email: "mohamed.soumare@trusk.com" }],
  ["site-limay", "Limay", "", "log", "sarah-gimenez-fauvety", { group: true }],
  ["limay-incoming", "", "Ouverture du site", "log", "site-limay", { vacant: true, note: "Équipe en cours de constitution" }],
  ["site-wissous", "Wissous", "", "log", "sarah-gimenez-fauvety", { group: true }],
  ["olivier-b", "Olivier Bromet", "Resp. Entrepôt", "log", "site-wissous", { email: "olivier@trusk.com" }],
  ["issoumaila-gassama", "Issoumaila Gassama", "Resp. d'Exploitation", "log", "olivier-b", { email: "issoumaila.gassama@trusk.com" }],
  ["pape-malick-dieng", "Pape Malick Dieng", "Suivi de Commandes", "log", "issoumaila-gassama", { linkedin: "https://www.linkedin.com/in/p-malick-dieng-421944172/", email: "papemalick@trusk.com" }],
  ["thomas-guerandelle", "Thomas Guerandelle", "Chef d'Équipe", "log", "pape-malick-dieng", { email: "thomas.guerandelle@trusk.com" }],
  ["ousmane-diallo", "Ousmane Diallo", "Cariste", "log", "thomas-guerandelle", { email: "ousmane.diallo@trusk.com" }],
  ["mariam-bance", "Mariam Bance", "Agent Logistique", "log", "ousmane-diallo", { email: "mariam.bance@trusk.com" }],
  ["djiby-traore", "Djiby Traoré", "Cariste", "log", "thomas-guerandelle", { email: "djiby.traore@trusk.com" }],
  ["hugo-luneville", "Hugo Luneville", "Responsable ROI", "roi", "sarah-gimenez-fauvety", { linkedin: "https://www.linkedin.com/in/hugo-lun%C3%A9ville-4a472a12a/", email: "hugo@trusk.com" }],
  ["sharon-bitton", "Sharon Bitton", "Ingénieure Optimisation", "roi", "hugo-luneville", { linkedin: "https://www.linkedin.com/in/sharon-bitton-9b6694216/", email: "sharon.bitton@trusk.com" }],
  ["stephane-bonanno", "Stéphane Bonanno", "Responsable Excellence Opérationnelle", "roi", "hugo-luneville", { linkedin: "https://www.linkedin.com/in/stephanebonanno/", email: "stephane.bonanno@trusk.com" }],
  ["sebastien-hourdin", "Sébastien Hourdin", "Product Manager", "roi", "hugo-luneville", { linkedin: "https://www.linkedin.com/in/s%C3%A9bastien-hourdin-692a02220/", email: "sebastien.hourdin@trusk.com" }],
  ["antoine-vercken", "Antoine Vercken", "Directeur Commercial & CRO", "sales", "sarah-gimenez-fauvety", { linkedin: "https://www.linkedin.com/in/antoine-vercken-6936964a/", email: "antoine@trusk.com", comex: true }],
  ["bastien-gimeno", "Bastien Gimeno", "Resp. Pilote de Flux", "ikea", "antoine-vercken", { linkedin: "https://www.linkedin.com/in/bastien-gimeno/", email: "bastien.gimeno@trusk.com" }],
  ["farid-assenine", "Farid Assenine", "Suivi de Commandes & Data Analyst", "ikea", "bastien-gimeno", { email: "farid.assenine@trusk.com" }],
  ["clement-fraisse", "Clément Fraisse", "Resp. Implant Magasin", "ikea", "bastien-gimeno", { linkedin: "https://www.linkedin.com/in/clement-fraisse/", email: "clement.fraisse@trusk.com" }],
  ["djegui-baradji", "Djegui Baradji", "Chef d'Équipe", "ikea", "clement-fraisse", { email: "djegui.baradji@trusk.com" }],
  ["kevin-carratero", "Kevin Carratero", "Chef d'Équipe", "ikea", "clement-fraisse", { email: "kevin.carratero@trusk.com" }],
  ["walid-ajjaji", "Walid Ajjaji", "Agent Logistique Implant", "ikea", "kevin-carratero", { linkedin: "https://www.linkedin.com/in/walid-ajjaji-81b529283/", email: "walid.ajjaji@trusk.com" }],
  ["jawad-hachami", "Jawad Hachami", "Chef d'Équipe", "ikea", "clement-fraisse", { linkedin: "https://www.linkedin.com/in/jawad-hachami-0339b0203/", email: "jawad.hachami@trusk.com" }],
  ["bilal-mtir", "Bilal Mtir", "Chef d'Équipe", "ikea", "clement-fraisse", { email: "bilal.mtir@trusk.com" }],
  ["julien-maquaire", "Julien Maquaire", "Resp. Log Flux Cross-Dock", "ikea", "bastien-gimeno", { linkedin: "https://www.linkedin.com/in/julien-maquaire/", email: "julien.maquaire@trusk.com" }],
  ["meziane-amziane", "Meziane Amziane", "Coordinateur Logistique", "ikea", "julien-maquaire", { linkedin: "https://www.linkedin.com/in/meziane-amziane-271467100/", email: "meziane.amziane@trusk.com" }],
  ["geoffrey-bataille", "Geoffrey Bataille", "Coordinateur Logistique", "ikea", "julien-maquaire", { linkedin: "https://www.linkedin.com/in/geoffrey-bataille-355037257/", email: "geoffrey.bataille@trusk.com" }],
  ["paul-mondy", "Paul Mondy", "Resp. Implant Magasin", "ikea", "bastien-gimeno", { linkedin: "https://www.linkedin.com/in/paulmondy/", email: "paul.mondy@trusk.com" }],
  ["djibrine-zakaria-kessep", "Djibrine Zakaria Kessep", "Chef d'Équipe", "ikea", "paul-mondy", { linkedin: "https://www.linkedin.com/in/djibrine-kessep-b006112a9/", email: "djibrine.kessep@trusk.com" }],
  ["mamadou-alassane-sall", "Mamadou Alassane Sall", "Chef d'Équipe", "ikea", "paul-mondy", { email: "mamadou.sall@trusk.com" }],
  ["tony-soudant", "Tony Soudant", "Chef d'Équipe", "ikea", "paul-mondy", { linkedin: "https://www.linkedin.com/in/tony-soudant-540315396/", email: "tony.soudant@trusk.com" }],
  ["jean-lagisquet", "Jean Lagisquet", "Agent Logistique", "ikea", "tony-soudant", { linkedin: "https://www.linkedin.com/in/jean-charlie-lagisquet/", email: "jean-charlie.lagisquet@trusk.com" }],
  ["mohammed-ali-nader", "Mohammed Ali Nader", "Agent Logistique", "ikea", "tony-soudant", { email: "mohammed.nader@trusk.com" }],
  ["anael-segui", "Anaël Segui", "Agent Logistique", "ikea", "tony-soudant", { email: "anael.segui@trusk.com" }],
  ["paul-billon", "Paul Billon", "Resp. Grands Comptes", "sales", "antoine-vercken", { linkedin: "https://www.linkedin.com/in/paul-billon-249006209/", email: "paul.billon@trusk.com" }],
  ["mickael-gourgues", "Mickaël Gourgues", "Resp. Grands Comptes", "sales", "antoine-vercken", { linkedin: "https://www.linkedin.com/in/mickael-gourgues/", email: "mickael@trusk.com" }],
  ["louis-hacot", "Louis Hacot", "Resp. Grands Comptes", "sales", "antoine-vercken", { linkedin: "https://www.linkedin.com/in/louishacot/", email: "louis.hacot@trusk.com" }],
  ["sonali-pravia", "Sonali Pravia", "Resp. Communication", "support", "sarah-gimenez-fauvety", { linkedin: "https://www.linkedin.com/in/sonalipravia/", email: "sonali@trusk.com" }],
  ["laura-d", "Laura Daniel", "Designer", "support", "sonali-pravia", { email: "laura.daniel@trusk.com" }],
  ["clement-tran-van-lieu", "Clément Tran Van Lieu", "Responsable Projet (maillage national)", "support", "sarah-gimenez-fauvety", { linkedin: "https://www.linkedin.com/in/clementtranvanlieu/", email: "clement.tvl@trusk.com" }],
  ["etienne-goubet", "Etienne Goubet", "Responsable Projet", "support", "clement-tran-van-lieu", { linkedin: "https://www.linkedin.com/in/etienne-g-b47880171/", email: "etienne.goubet@trusk.com" }],
  ["emilie-vinit", "Emilie Vinit", "Directrice des RH", "support", "sarah-gimenez-fauvety", { linkedin: "https://www.linkedin.com/in/emilievinit/", email: "emilie@trusk.com", comex: true }],
  ["elise-tremorin", "Elise Trémorin", "Chargée RH", "support", "emilie-vinit", { linkedin: "https://www.linkedin.com/in/elise-tr%C3%A9morin-ab6796140/", email: "elise.tremorin@trusk.com" }],
  ["nicolas-papin", "Nicolas Papin", "Directeur Technique", "tech", "sarah-gimenez-fauvety", { linkedin: "https://www.linkedin.com/in/nicolas-papin/", email: "nicolas.aditi@trusk.com", comex: true }],
  ["mohamed-amhal", "Mohamed Amhal", "Lead Q/A", "cc", "nicolas-papin", { linkedin: "https://www.linkedin.com/in/mohamed-amhal-168360254/", email: "mohamed.amhal@trusk.com" }],
  ["arthur-nguyen-binh", "Arthur Nguyen Binh", "Data Engineer", "cc", "nicolas-papin", { linkedin: "https://www.linkedin.com/in/arthur-nguyen-binh/", email: "arthur.nguyen@trusk.com" }],
  ["gregory-boulanger", "Grégory Boulanger", "Lead Product Manager", "produit", "nicolas-papin", { linkedin: "https://www.linkedin.com/in/gregory-boulanger/", email: "gregory.boulanger@trusk.com" }],
  ["fannie-jacquemin", "Fannie Jacquemin", "Product Manager", "produit", "gregory-boulanger", { linkedin: "https://www.linkedin.com/in/fannie-jacquemin-a077abb2/?originalSubdomain=fr", email: "fannie.jacquemin@trusk.com" }],
  ["roman-jauneaux", "Roman Jauneaux", "Product Manager", "produit", "gregory-boulanger", { linkedin: "https://www.linkedin.com/in/roman-jauneaux-429887a8/", email: "roman.jauneaux@trusk.com" }],
  ["thomas-chabert", "Thomas Chabert", "Lead Tech", "tech", "nicolas-papin", { linkedin: "https://www.linkedin.com/in/thomas-chabert-4368b4b7/", email: "thomas.chabert@trusk.com" }],
  ["andy-gigon", "Andy Gigon", "Dev", "tech", "thomas-chabert", { linkedin: "https://www.linkedin.com/in/andygigon/", email: "andy.gigon@trusk.com" }],
  ["yvan-dervillier", "Yvan Dervillier", "Lead DevOps", "tech", "nicolas-papin", { linkedin: "https://www.linkedin.com/in/yvandervillier/", email: "yvan.dervillier@trusk.com" }],
  ["tristan-antiope", "Tristan Antiope", "DevOps", "tech", "yvan-dervillier", { linkedin: "https://www.linkedin.com/in/tristan-antiope-9b9a4699/", email: "tristan.antiope@trusk.com" }],
  ["hadrien-lausson", "Hadrien Lausson", "Lead Tech", "tech", "nicolas-papin", { linkedin: "https://www.linkedin.com/in/hadrien-lausson-50132220/", email: "hadrien.lausson@trusk.com" }],
  ["arthur-leroux", "Arthur Leroux", "Dev", "tech", "hadrien-lausson", { linkedin: "https://www.linkedin.com/in/arthurleroux/", email: "arthur.leroux@trusk.com" }],
  ["julien-loiseleur", "Julien Loiseleur", "Dev", "tech", "hadrien-lausson", { linkedin: "https://www.linkedin.com/in/julien-l-971024148/", email: "julien@trusk.com" }],
  ["mohamed-sarih", "Mohamed Sarih", "Lead Q/A", "tech", "nicolas-papin", { linkedin: "https://www.linkedin.com/in/mohamed-sarih-9065b943/", email: "mohamed.sarih@trusk.com" }],
  ["nicolas-simon", "Nicolas Simon", "Lead Tech", "tech", "nicolas-papin", { linkedin: "https://www.linkedin.com/in/nsimonfr/", email: "nicolas.simon@trusk.com" }],
  ["josue-beauclair-bilong-ngoue", "Josue Beauclair Bilong Ngoue", "Dev", "tech", "nicolas-simon", { email: "beauclair.bilong@trusk.com" }],
  ["souhaire-fernane", "Souhaire Fernane", "Dev", "tech", "nicolas-simon", { linkedin: "https://www.linkedin.com/in/souhaire-f-b51135106/", email: "souhaire.fernane@trusk.com" }],
  ["celine-gomes", "Céline Gomes", "Directrice des Opérations", "transport", "sarah-gimenez-fauvety", { linkedin: "https://www.linkedin.com/in/celine-bellanger-gomes-5287622/", email: "celine.gomes@trusk.com", comex: true }],
  ["mickael-mahamade", "Mickael Mahamade", "Customer Operationnal & Tech Lead", "cc", "celine-gomes", { linkedin: "https://www.linkedin.com/in/mickael-mahamade-7521b1241/", email: "mickael.mahamade@trusk.com" }],
  ["cynthia-ramamonjisoa", "Cynthia Ramamonjisoa", "People & Quality Lead", "cc", "celine-gomes", { linkedin: "https://www.linkedin.com/in/cynthiaramamonjisoa/", email: "cynthia@trusk.com" }],
  ["rayan-aboud", "Rayan Aboud", "Gestionnaire de Clientèle", "cc", "cynthia-ramamonjisoa", { linkedin: "https://www.linkedin.com/in/rayanaboud/", email: "rayan.aboud@trusk.com" }],
  ["mamadou-salif-balde", "Mamadou Salif Balde", "Gestionnaire de Clientèle", "cc", "cynthia-ramamonjisoa", { linkedin: "https://www.linkedin.com/in/mamadou-balde-57a761330/", email: "mamadou.balde@trusk.com" }],
  ["pricyle-jordier", "Pricyle Jordier", "Gestionnaire de Clientèle", "cc", "cynthia-ramamonjisoa", { email: "pricyle.jordier@trusk.com" }],
  ["bryan-lamin-kamara", "Bryan-Lamin Kamara", "Gestionnaire de Clientèle", "cc", "cynthia-ramamonjisoa", { linkedin: "https://www.linkedin.com/in/bryan-lamin-kamara-a6ab2a250/", email: "bryan-lamin.kamara@trusk.com" }],
  ["lenny-biluaka-kinanga", "Lenny Biluaka Kinanga", "Admin Suivi de Commande", "cc", "cynthia-ramamonjisoa", { linkedin: "https://www.linkedin.com/in/lenny-kinanga-mpasi-b4311a189/", email: "lenny.mpasi@trusk.com" }],
  ["niry-ranaivoson", "Niry Ranaivoson", "Gestionnaire de Clientèle", "cc", "cynthia-ramamonjisoa", { linkedin: "https://www.linkedin.com/in/niry-ranaivoson-02173/", email: "niry.ranaivoson@trusk.com" }],
  ["hasna-saihine", "Hasna Saihine", "Gestionnaire de Clientèle", "cc", "cynthia-ramamonjisoa", { linkedin: "https://www.linkedin.com/in/hasna-saihine-50a867108/", email: "hasna.saihine@trusk.com" }],
  ["yacine-laouissette", "Yacine Laouissette", "Resp. Dispatch", "dispatch", "celine-gomes", { email: "yassine@trusk.com" }],
  ["yanis-haddar", "Yanis Haddar", "Gestionnaire Dispatch", "dispatch", "yacine-laouissette", { email: "yanis.haddar@trusk.com" }],
  ["youness-keita", "Youness Keita", "Gestionnaire Dispatch", "dispatch", "yacine-laouissette", { linkedin: "https://www.linkedin.com/in/youness-keita/", email: "youness.keita@trusk.com" }],
  ["maissane-mahmoud-bacha", "Maïssane Mahmoud-Bacha", "Gestionnaire Dispatch", "dispatch", "yacine-laouissette", { linkedin: "https://www.linkedin.com/in/ma%C3%AFssane-b-5b1a5a198/", email: "maissane@trusk.com" }],
  ["loic-nkwamen-tchatou", "Loic Nkwamen Tchatou", "Gestionnaire Dispatch", "dispatch", "yacine-laouissette", { linkedin: "https://www.linkedin.com/in/lo%C3%AFc-nkwamen-481902223/", email: "loic.nkwamen@trusk.com" }],
  ["jonathan-nzia", "Jonathan Nzia", "Gestionnaire Dispatch", "dispatch", "yacine-laouissette", { email: "jonathan.nzia@trusk.com" }],
  ["sylvain-alemany", "Sylvain Alemany", "Resp. Transport", "transport", "celine-gomes", { linkedin: "https://www.linkedin.com/in/sylvain-alemany/", email: "sylvain.alemany@trusk.com" }],
  ["philippe-boumsell", "Philippe Boumsell", "Manager Flotte Villes", "transport", "sylvain-alemany", { linkedin: "https://www.linkedin.com/in/philippe-boumsell-228a50242/", email: "philippe.boumsell@trusk.com" }],
  ["pierre-fontaine", "Pierre Fontaine", "Gestionnaire de Flotte", "transport", "philippe-boumsell", { linkedin: "https://www.linkedin.com/in/pierre-fontaine-672ba1223/", email: "pierre.fontaine@trusk.com" }],
  ["thomas-lebeuf", "Thomas Lebeuf", "Gestionnaire de Flotte", "transport", "philippe-boumsell", { linkedin: "https://www.linkedin.com/in/thomas-lebeuf-9a5514288/", email: "thomas.lebeuf@trusk.com" }],
  ["yann-poulet", "Yann Poulet", "Gestionnaire de Flotte", "transport", "philippe-boumsell", { linkedin: "https://www.linkedin.com/in/yann-p-734b83396/", email: "yann.poulet@trusk.com" }],
  ["marc-romagnoli", "Marc Romagnoli", "Gestionnaire de Flotte", "transport", "philippe-boumsell", { linkedin: "https://www.linkedin.com/in/marc-romagnoli-305069208/", email: "marc.romagnoli@trusk.com" }],
  ["thomas-demard", "Thomas Demard", "Manager Flotte IDF & VE", "transport", "sylvain-alemany", { linkedin: "https://www.linkedin.com/in/thomas-demard/", email: "thomas.demard@trusk.com" }],
  ["oussy-fofana", "Oussy Fofana", "Gestionnaire Relation Capacitaires", "transport", "thomas-demard", { linkedin: "https://www.linkedin.com/in/oussy-f-5556ab233/", email: "oussy.fofana@trusk.com" }],
  ["nicolas-aditi", "Nicolas Aditi", "Gestionnaire de Flotte", "transport", "oussy-fofana", { linkedin: "https://www.linkedin.com/in/nicolasaditi/", email: "nicolas.aditi@trusk.com" }],
  ["abdoul-matinou-agouda", "Abdoul-Matinou Agouda", "Gestionnaire de Flotte", "transport", "oussy-fofana", { linkedin: "https://www.linkedin.com/in/abdoul-matinou-agouda-b47676201/", email: "matinou.agouda@trusk.com" }],
  ["charles-berejnoi", "Charles Berejnoi", "Gestionnaire de Flotte", "transport", "oussy-fofana", { linkedin: "https://www.linkedin.com/in/charles-berejno%C3%AF-57739421a/", email: "charles.berejnoi@trusk.com" }],
  ["alexis-reffet", "Alexis Reffet", "Gestionnaire de Flotte", "transport", "oussy-fofana", { linkedin: "https://www.linkedin.com/in/alexis-reffet-487184251/", email: "alexis.reffet@trusk.com" }],
  ["sebastien-tronel", "Sébastien Tronel", "Co-Fondateur & Directeur Financier", "support", "thomas-effantin", { linkedin: "https://www.linkedin.com/in/sebastientronel/", email: "sebastien@trusk.com", comex: true }],
  ["cyrille-g", "Cyrille Galgon", "RAF", "support", "sebastien-tronel", { email: "cyrille@trusk.com" }],
  ["paul-vanneste", "Paul Vanneste", "RAF & Resp. RSSI", "support", "cyrille-g", { linkedin: "https://www.linkedin.com/in/paul-campbell-vanneste-274490176/", email: "paul.vanneste@trusk.com" }],
  ["soukaina-rachad", "Soukaina Rachad", "Juriste", "support", "sebastien-tronel", { linkedin: "https://www.linkedin.com/in/soukaina-rachad-bb05341a3/", email: "soukaina.rachad@trusk.com" }],
  ["louise-chatot", "Louise Chatot", "Gestionnaire Litige", "support", "soukaina-rachad", { linkedin: "https://www.linkedin.com/in/louise-chatot-1239541bb/", email: "louise.chatot@trusk.com" }],
  ["maelys-yebga", "Maelys Yebga", "Responsable Conformité", "support", "sebastien-tronel", { email: "maelys@trusk.com" }],
];

const seedPeople = () =>
  SEED.map(([id, name, role, dept, managerId, flags = {}]) => ({
    id,
    name,
    role,
    dept,
    managerId,
    type: flags.group ? "group" : "person",
    vacant: !!flags.vacant,
    note: flags.note || "",
    linkedin: flags.linkedin || "",
    email: flags.email || "",
    also: flags.also || "",
    comex: !!flags.comex,
    phone: "",
    photo: "",
  }));

/* ------------------------------------------------------------------ *
 *  Utilitaires
 * ------------------------------------------------------------------ */

const uid = () => Math.random().toString(36).slice(2, 9);

const initials = (name) => {
  const parts = (name || "?").replace(/[^\p{L}\s.'-]/gu, "").split(/[\s.]+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

const norm = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/* Regroupe les frères et sœurs qui partagent le même intitulé de poste
   sous le même manager — reproduit les cartes collectives du document. */
function buildNodes(people, collapsed, matchIds) {
  const byId = new Map(people.map((p) => [p.id, p]));
  const childrenOf = new Map();
  const roots = [];
  for (const p of people) {
    if (p.managerId && byId.has(p.managerId)) {
      if (!childrenOf.has(p.managerId)) childrenOf.set(p.managerId, []);
      childrenOf.get(p.managerId).push(p);
    } else roots.push(p);
  }

  const nodeChildren = new Map();
  const nodes = new Map();

  const makeNodes = (list) => {
    const out = [];
    const buckets = new Map();
    for (const p of list) {
      // les groupes et les postes vacants ne fusionnent jamais
      const key =
        p.type === "group" || p.vacant
          ? `solo:${p.id}`
          : `${norm(p.role)}|${p.dept}|${p.linkedin ? 1 : 0}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(p);
    }
    for (const [, members] of buckets) {
      const head = members[0];
      const nid = members.length > 1 ? `m_${members.map((m) => m.id).join("_")}` : head.id;
      out.push({
        id: nid,
        members,
        head,
        kind: head.type === "group" ? "group" : head.vacant ? "vacant" : "person",
      });
    }
    return out;
  };

  const walk = (list, seen) => {
    const built = makeNodes(list);
    for (const n of built) {
      nodes.set(n.id, n);
      const kids = [];
      for (const m of n.members) {
        if (seen.has(m.id)) continue;
        seen.add(m.id);
        for (const c of childrenOf.get(m.id) || []) kids.push(c);
      }
      const hasMatch = n.members.some((m) => matchIds && matchIds.has(m.id));
      const isCollapsed = collapsed.has(n.id) && !hasMatch;
      n.hasChildren = kids.length > 0;
      n.collapsed = isCollapsed && kids.length > 0;
      nodeChildren.set(n.id, n.collapsed ? [] : walk(kids, seen));
      n.childCount = kids.length;
    }
    return built;
  };

  const rootNodes = walk(roots, new Set());
  return { rootNodes, nodeChildren, nodes, childrenOf, byId };
}

const CARD_W = 300;
const PAD = 18;
const AVATAR = 60;
const H_GAP = 28;
const ROW_GAP = 62;

/* Estimation servant uniquement au tout premier rendu : chaque carte
   mesure ensuite sa hauteur réelle et la renvoie au moteur de placement,
   qui recalcule le layout. Aucune hauteur n'est fixée à l'aveugle. */
function estimateHeight(node) {
  if (node.kind === "group") return 32;
  const rl = Math.min(3, Math.max(1, Math.ceil((node.head.role || "").length / 22)));
  const foot = node.hasChildren ? 30 : 0;
  if (node.members.length > 1) return 16 + rl * 16 + 10 + node.members.length * 36 + 16 + foot;
  if (node.kind === "vacant") return PAD + Math.max(AVATAR, 22 + rl * 18 + 17) + PAD + foot;
  return PAD + Math.max(AVATAR, 22 + rl * 18 + 17) + 14 + 20 + PAD + foot;
}

function layout(rootNodes, nodeChildren, heights) {
  const pos = new Map();
  let cursor = 0;

  const place = (node, depth) => {
    const kids = nodeChildren.get(node.id) || [];
    let x;
    if (!kids.length) {
      x = cursor;
      cursor += CARD_W + H_GAP;
    } else {
      const xs = kids.map((k) => place(k, depth + 1));
      x = (xs[0] + xs[xs.length - 1]) / 2;
    }
    const h = heights[node.id] || estimateHeight(node);
    pos.set(node.id, { x, y: 0, depth, h, isGroup: node.kind === "group" });
    return x;
  };
  rootNodes.forEach((r) => {
    place(r, 0);
    cursor += CARD_W;
  });

  const rowH = [];
  pos.forEach((p) => { rowH[p.depth] = Math.max(rowH[p.depth] || 0, p.h); });
  const rowTop = [];
  let acc = 0;
  for (let d = 0; d < rowH.length; d++) {
    rowTop[d] = acc;
    acc += (rowH[d] || 0) + ROW_GAP;
  }
  pos.forEach((p) => {
    // une étiquette de section se cale en bas de sa rangée, sinon elle
    // flotte loin au-dessus de ses cartes quand la rangée est haute
    p.y = p.isGroup
      ? rowTop[p.depth] + Math.max(0, (rowH[p.depth] || 0) - p.h)
      : rowTop[p.depth];
  });

  let maxX = 0, maxY = 0;
  pos.forEach((p) => {
    maxX = Math.max(maxX, p.x + CARD_W);
    maxY = Math.max(maxY, p.y + p.h);
  });
  return { pos, width: maxX + 100, height: maxY + 100 };
}


/* ------------------------------------------------------------------ *
 *  Composant principal
 * ------------------------------------------------------------------ */

export default function OrgChart() {
  const [people, setPeople] = useState(seedPeople);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("idle");

  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState("chart");
  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState(null);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [zoom, setZoom] = useState(0.75);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [heights, setHeights] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const [selected, setSelected] = useState(null);
  const [panel, setPanel] = useState(null); // 'code' | 'theme' | 'depts' | 'edit' | 'import'
  const [editing, setEditing] = useState(null);

  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const didInit = useRef(false);

  /* ---------- chargement / sauvegarde partagée ---------- */

  const [published, setPublished] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const d = await loadState();
        if (d) {
          if (d.people?.length) setPeople(d.people);
          if (d.departments?.length) setDepartments(d.departments);
          if (d.theme) setTheme({ ...DEFAULT_THEME, ...d.theme });
        } else {
          // base encore vide : on affiche les données livrées avec le code,
          // qu'un administrateur pourra publier en un clic
          setPublished(false);
        }
      } catch (e) {
        console.error("Lecture Supabase impossible :", e);
        setPublished(false);
      }
      setLoaded(true);
    })();

    // la session d'administration est gérée par Supabase, plus par un code
    return onAuth((session) => setIsAdmin(!!session));
  }, []);

  const persist = useCallback(
    async (next = {}) => {
      const payload = {
        people: next.people ?? people,
        departments: next.departments ?? departments,
        theme: next.theme ?? theme,
      };
      setSaveState("saving");
      try {
        await persistState(payload);
        setPublished(true);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1600);
      } catch (e) {
        console.error(e);
        setSaveState("error");
      }
    },
    [people, departments, theme]
  );

  /* ---------- polices ---------- */

  /* ---------- dérivés ---------- */

  const deptById = useMemo(
    () => new Map(departments.map((d) => [d.id, d])),
    [departments]
  );

  const visiblePeople = useMemo(() => {
    if (!deptFilter) return people;
    const byId = new Map(people.map((p) => [p.id, p]));
    const keep = new Set();
    for (const p of people) {
      if (p.dept !== deptFilter) continue;
      keep.add(p.id);
      let cur = p.managerId;
      let guard = 0;
      while (cur && byId.has(cur) && guard++ < 40) {
        keep.add(cur);
        cur = byId.get(cur).managerId;
      }
    }
    return people.filter((p) => keep.has(p.id));
  }, [people, deptFilter]);

  const matchIds = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return null;
    const direct = people.filter(
      (p) => norm(p.name).includes(q) || norm(p.role).includes(q)
    );
    const byId = new Map(people.map((p) => [p.id, p]));
    const set = new Set();
    for (const p of direct) {
      set.add(p.id);
      let cur = p.managerId;
      let guard = 0;
      while (cur && byId.has(cur) && guard++ < 40) {
        set.add(cur);
        cur = byId.get(cur).managerId;
      }
    }
    return set;
  }, [query, people]);

  const directMatch = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return new Set();
    return new Set(
      people
        .filter((p) => norm(p.name).includes(q) || norm(p.role).includes(q))
        .map((p) => p.id)
    );
  }, [query, people]);

  const tree = useMemo(
    () => buildNodes(visiblePeople, collapsed, matchIds),
    [visiblePeople, collapsed, matchIds]
  );
  const onMeasure = useCallback((id, h) => {
    setHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));
  }, []);
  const geom = useMemo(
    () => layout(tree.rootNodes, tree.nodeChildren, heights),
    [tree, heights]
  );

  const counts = useMemo(() => {
    const staff = people.filter((p) => p.type === "person" && !p.vacant);
    const open = people.filter((p) => p.vacant);
    const used = new Set(staff.map((p) => p.dept));
    return { staff: staff.length, open: open.length, depts: used.size,
             comex: people.filter((p) => p.comex).length };
  }, [people]);

  /* ---------- repli par défaut (au-delà du COMEX) ---------- */

  useEffect(() => {
    if (didInit.current || !loaded) return;
    didInit.current = true;
    const { rootNodes, nodeChildren } = buildNodes(people, new Set(), null);
    const toCollapse = new Set();
    const walk = (nodes, depth) => {
      for (const n of nodes) {
        const kids = nodeChildren.get(n.id) || [];
        // les étiquettes de section restent toujours ouvertes : les replier
        // masquerait un site entier derrière un simple titre
        const underGroup = depth >= 1 && nodes.parentKind === "group";
        if (depth >= 2 && kids.length && n.kind !== "group" && !underGroup)
          toCollapse.add(n.id);
        const next = kids;
        next.parentKind = n.kind;
        walk(next, depth + 1);
      }
    };
    walk(rootNodes, 0);
    setCollapsed(toCollapse);
  }, [loaded, people]);

  /* ---------- interactions canvas ---------- */

  /* Cadrage : la largeur visible dépend des branches repliées, on ajuste
     donc sur la géométrie réelle plutôt que sur une valeur figée. */
  const frameAll = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const z = Math.max(0.12, Math.min(r.width / geom.width, r.height / geom.height) * 0.92);
    setZoom(z);
    setPan({
      x: (r.width - geom.width * z) / 2,
      y: Math.max(20, (r.height - geom.height * z) / 2),
    });
  }, [geom.width, geom.height]);

  /* Vue d'ouverture : tout ce qui est déplié tient à l'écran, sans
     descendre sous une taille illisible. */
  const frameDefault = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const raw = Math.min(r.width / geom.width, (r.height - 40) / geom.height) * 0.94;
    const z = Math.min(1, Math.max(0.42, raw));
    setZoom(z);
    setPan({ x: (r.width - geom.width * z) / 2, y: 24 });
  }, [geom.width, geom.height]);

  const centerOnRoot = useCallback(() => {
    const el = canvasRef.current;
    if (!el || !tree.rootNodes.length) return;
    const r = el.getBoundingClientRect();
    const root = geom.pos.get(tree.rootNodes[0].id);
    const z = 1;
    setZoom(z);
    setPan({
      x: r.width / 2 - (root ? root.x + CARD_W / 2 : geom.width / 2) * z,
      y: 28,
    });
  }, [geom, tree.rootNodes]);

  /* Le cadrage d'ouverture doit attendre que la géométrie soit stable :
     le repli automatique des branches et la mesure des cartes modifient
     tous deux les dimensions après le premier rendu. Le minuteur est
     relancé à chaque changement et ne se déclenche qu'une fois calmé. */
  const framed = useRef(false);
  useEffect(() => {
    framed.current = false;
  }, [deptFilter, view]);
  useEffect(() => {
    if (!loaded || view !== "chart" || framed.current) return;
    const t = setTimeout(() => {
      frameDefault();
      framed.current = true;
    }, 160);
    return () => clearTimeout(t);
  }, [loaded, view, geom.width, geom.height, frameDefault]);

  const onPointerDown = (e) => {
    if (e.target.closest("[data-card]")) return;
    dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    setPan({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
  };
  const onPointerUp = () => (dragRef.current = null);

  const toggleCollapse = (nid) =>
    setCollapsed((prev) => {
      const n = new Set(prev);
      n.has(nid) ? n.delete(nid) : n.add(nid);
      return n;
    });

  /* ---------- mutations (mode admin) ---------- */

  const stamp = () => {
    const d = new Date();
    const two = (n) => String(n).padStart(2, "0");
    return `${two(d.getDate())}/${two(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`;
  };

  const savePerson = (p) => {
    const exists = people.some((x) => x.id === p.id);
    const next = exists
      ? people.map((x) => (x.id === p.id ? p : x))
      : [...people, p];
    setPeople(next);
    const t = { ...theme, updatedAt: stamp() };
    setTheme(t);
    persist({ people: next, theme: t });
    setEditing(null);
    setPanel(null);
  };

  const removePerson = (id) => {
    const kids = people.filter((p) => p.managerId === id);
    const target = people.find((p) => p.id === id);
    const next = people
      .filter((p) => p.id !== id)
      .map((p) => (p.managerId === id ? { ...p, managerId: target?.managerId ?? null } : p));
    setPeople(next);
    const t = { ...theme, updatedAt: stamp() };
    setTheme(t);
    persist({ people: next, theme: t });
    setSelected(null);
    setEditing(null);
    setPanel(null);
    setPendingDelete(null);
  };

  const importCSV = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const rows = data.filter((r) => (r.nom || r.name || "").trim() || (r.poste || "").trim());
        const made = rows.map((r) => ({
          id: uid(),
          name: (r.nom || r.name || "").trim(),
          role: (r.poste || r.role || "").trim(),
          dept:
            departments.find(
              (d) => norm(d.name) === norm(r.departement || r.department || "")
            )?.id || departments[0]?.id,
          managerId: null,
          _managerName: (r.manager || "").trim(),
          type: norm(r.type || "") === "groupe" ? "group" : "person",
          vacant: !!(r.statut || "").trim(),
          note: (r.statut || "").trim(),
          comex: norm(r.comex || "").includes("comex"),
          email: (r.email || "").trim(),
          phone: (r.telephone || r.phone || "").trim(),
          photo: (r.photo || "").trim(),
          linkedin: (r.linkedin || "").trim(),
          also: (r.rattachement_secondaire || "").trim(),
        }));
        const byName = new Map();
        made.forEach((m) => { if (m.name) byName.set(norm(m.name), m.id); });
        const resolved = made.map(({ _managerName, ...m }) => ({
          ...m,
          managerId: byName.get(norm(_managerName)) ?? null,
        }));
        const orphans = made.filter(
          (m) => m._managerName && !byName.has(norm(m._managerName))
        ).length;
        setPeople(resolved);
        persist({ people: resolved });
        didInit.current = false;
        setPanel(null);
        alert(
          `${resolved.length} fiches importées.` +
            (orphans ? ` ${orphans} manager(s) introuvable(s) : ces personnes sont remontées à la racine.` : "")
        );
      },
    });
  };

  const exportCSV = () => {
    const byId = new Map(people.map((p) => [p.id, p]));
    const csv = Papa.unparse(
      people.map((p) => ({
        nom: p.name,
        poste: p.role,
        departement: deptById.get(p.dept)?.name || "",
        manager: byId.get(p.managerId)?.name || byId.get(p.managerId)?.role || "",
        type: p.type === "group" ? "groupe" : "personne",
        statut: p.vacant ? (p.note || "En cours de recrutement") : "",
        comex: p.comex ? "COMEX" : "",
        email: p.email,
        telephone: p.phone,
        photo: p.photo,
        linkedin: p.linkedin,
        rattachement_secondaire: p.also,
      }))
    );
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `organigramme-${norm(theme.orgName) || "export"}.csv`;
    a.click();
  };

  /* ---------- styles dérivés du thème ---------- */

  const F = FONTS[theme.font]?.stack || FONTS.poppins.stack;
  const S = {
    "--accent": theme.accent,
    "--ink": theme.ink,
    "--canvas": theme.canvas,
    "--surface": theme.surface,
    "--line": theme.line,
    "--r": `${theme.radius}px`,
    fontFamily: F,
  };

  if (!loaded) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ fontFamily: F }}>
        <p className="text-sm text-gray-500">Chargement de l'organigramme…</p>
      </div>
    );
  }

  /* ---------- rendu ---------- */

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ ...S, background: "var(--canvas)", color: "var(--ink)" }}
    >
      {/* ================= HEADER ================= */}
      <header
        className="shrink-0 border-b"
        style={{ background: "var(--surface)", borderColor: "var(--line)" }}
      >
        <div className="flex items-center gap-3 px-4 h-16">
          <div className="flex items-center gap-3 shrink-0">
            {theme.logo ? (
              <img
                src={theme.logo}
                alt={theme.orgName}
                className="h-[18px] w-auto shrink-0"
                style={{ objectFit: "contain" }}
              />
            ) : (
              <h1 className="font-extrabold leading-none text-[19px]" style={{ letterSpacing: "-0.02em" }}>
                {theme.orgName}
              </h1>
            )}
            <span className="hidden sm:block w-px h-5" style={{ background: "var(--line)" }} />
            <p
              className="hidden sm:block text-[10px] font-semibold leading-tight"
              style={{ color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}
            >
              Organigramme
            </p>
          </div>

          <div className="relative flex-1 max-w-md mx-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un nom, un poste…"
              className="w-full h-9 pl-9 pr-8 text-sm outline-none border"
              style={{
                borderRadius: "var(--r)",
                borderColor: "var(--line)",
                background: "var(--canvas)",
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className="flex p-0.5 border"
              style={{ borderRadius: "var(--r)", borderColor: "var(--line)" }}
            >
              {[
                ["chart", LayoutGrid, "Organigramme"],
                ["list", List, "Liste"],
              ].map(([v, Icon, label]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  title={label}
                  className="px-2.5 h-7 flex items-center gap-1.5 text-xs font-semibold transition"
                  style={{
                    borderRadius: `calc(var(--r) - 2px)`,
                    background: view === v ? "var(--ink)" : "transparent",
                    color: view === v ? "#fff" : "inherit",
                  }}
                >
                  <Icon size={13} />
                  <span className="hidden lg:inline">{label}</span>
                </button>
              ))}
            </div>

            {isAdmin ? (
              <>
                <button
                  onClick={() => { setEditing(newPerson(departments)); setPanel("edit"); }}
                  className="h-8 px-3 flex items-center gap-1.5 text-xs font-semibold text-white"
                  style={{ background: "var(--accent)", borderRadius: "var(--r)" }}
                >
                  <Plus size={14} /> Ajouter
                </button>
                <IconBtn title="Départements" onClick={() => setPanel("depts")}><Users size={15} /></IconBtn>
                <IconBtn title="Thème" onClick={() => setPanel("theme")}><Palette size={15} /></IconBtn>
                <IconBtn title="Import / export" onClick={() => setPanel("import")}><Settings2 size={15} /></IconBtn>
                <IconBtn title="Se déconnecter" onClick={() => signOut()}><Unlock size={15} /></IconBtn>
              </>
            ) : (
              <IconBtn title="Mode admin" onClick={() => setPanel("code")}><Lock size={15} /></IconBtn>
            )}
          </div>
        </div>

        {/* Barre de contexte */}
        <div
          className="flex items-center gap-3 px-4 h-11 border-t overflow-x-auto"
          style={{ borderColor: "var(--line)" }}
        >
          <span className="text-xs font-semibold whitespace-nowrap">
            {counts.staff} <span className="opacity-50 font-normal">collaborateurs</span>
          </span>
          {counts.open > 0 && (
            <span className="text-xs font-semibold whitespace-nowrap opacity-70">
              {counts.open} <span className="opacity-70 font-normal">postes ouverts</span>
            </span>
          )}
          <span className="text-xs font-semibold whitespace-nowrap">
            {counts.depts} <span className="opacity-50 font-normal">équipes</span>
          </span>
          <span className="text-xs font-semibold whitespace-nowrap">
            {counts.comex} <span className="opacity-50 font-normal">au COMEX</span>
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setDeptFilter(null)}
              className="px-2.5 h-6 text-[11px] font-semibold border whitespace-nowrap transition"
              style={{
                borderRadius: 999,
                borderColor: deptFilter ? "var(--line)" : "var(--ink)",
                background: deptFilter ? "transparent" : "var(--ink)",
                color: deptFilter ? "inherit" : "#fff",
              }}
            >
              Tout
            </button>
            {departments.map((d) => {
              const on = deptFilter === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setDeptFilter(on ? null : d.id)}
                  className="px-2.5 h-6 text-[11px] font-semibold border whitespace-nowrap flex items-center gap-1.5 transition"
                  style={{
                    borderRadius: 999,
                    borderColor: on ? d.color : "var(--line)",
                    background: on ? d.color : "transparent",
                    color: on ? "#fff" : "inherit",
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: on ? "#fff" : d.color }}
                  />
                  {d.name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ================= CORPS ================= */}
      {view === "chart" ? (
        <div className="relative flex-1 overflow-hidden">
          <div
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "0 0",
                width: geom.width,
                height: geom.height,
                position: "relative",
              }}
            >
              <Connectors tree={tree} geom={geom} line={theme.line} />
              {[...tree.nodes.values()].map((n) => {
                const p = geom.pos.get(n.id);
                if (!p) return null;
                return (
                  <Card
                    key={n.id}
                    node={n}
                    x={p.x}
                    y={p.y}
                    depth={p.depth}
                    theme={theme}
                    dept={deptById.get(n.head.dept)}
                    isAdmin={isAdmin}
                    onEdit={(h) => { setEditing({ ...h }); setPanel("edit"); }}
                    onMeasure={onMeasure}
                    onDelete={(h) => setPendingDelete(h)}
                    onAddReport={(h) => {
                      setEditing({ ...newPerson(departments), dept: h.dept, managerId: h.id });
                      setPanel("edit");
                    }}
                    dimmed={query && !n.members.some((m) => directMatch.has(m.id))}
                    onOpen={(m) => setSelected(m)}
                    onToggle={() => toggleCollapse(n.id)}
                  />
                );
              })}
            </div>
          </div>

          {/* Contrôles de zoom et mention de mise à jour */}
          <div className="absolute bottom-4 left-4 flex flex-col items-start gap-1.5">
          <div
            className="flex items-center gap-1 p-1 border shadow-sm"
            style={{ background: "var(--surface)", borderColor: "var(--line)", borderRadius: "var(--r)" }}
          >
            <IconBtn title="Dézoomer" onClick={() => setZoom((z) => Math.max(0.15, z - 0.12))}><ZoomOut size={15} /></IconBtn>
            <span className="text-[11px] font-semibold tabular-nums w-10 text-center opacity-60">
              {Math.round(zoom * 100)}%
            </span>
            <IconBtn title="Zoomer" onClick={() => setZoom((z) => Math.min(2, z + 0.12))}><ZoomIn size={15} /></IconBtn>
            <div className="w-px h-5 mx-0.5" style={{ background: "var(--line)" }} />
            <IconBtn title="Voir tout l'organigramme" onClick={frameAll}><Maximize2 size={15} /></IconBtn>
            <IconBtn title="Revenir en haut, taille réelle" onClick={centerOnRoot}><CornerUpLeft size={15} /></IconBtn>
            <IconBtn
              title="Tout déplier"
              onClick={() => setCollapsed(new Set())}
            >
              <ChevronDown size={15} />
            </IconBtn>
          </div>
            <p className="pl-1 text-[9px] leading-none italic" style={{ color: "#BFC5D1" }}>
              Mis à jour le {theme.updatedAt}
              {theme.updatedBy ? ` — ${theme.updatedBy}` : ""}
            </p>
          </div>

          {/* Message d'accueil, refermable */}
          {theme.sideband && showIntro && (
            <div
              className="absolute top-3 left-3 sm:top-4 sm:left-4 pl-4 pr-9 py-3.5 shadow-lg"
              style={{
                background: "var(--accent)",
                borderRadius: "var(--r)",
                /* jamais plus large que l'écran moins les marges : la carte
                   reste une carte, du mobile au grand écran */
                width: "min(300px, calc(100vw - 24px))",
              }}
            >
              <p
                className="text-[10px] font-bold text-white/60"
                style={{ textTransform: "uppercase", letterSpacing: "0.14em" }}
              >
                Organigramme
              </p>
              <p className="mt-1 text-[13.5px] font-semibold leading-snug text-white">
                {theme.tagline}
              </p>
              <button
                onClick={() => setShowIntro(false)}
                className="absolute top-2.5 right-2.5 h-6 w-6 grid place-items-center text-white/70 hover:text-white hover:bg-white/15"
                style={{ borderRadius: 7 }}
                title="Fermer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {query && directMatch.size === 0 && (
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 text-xs border shadow-sm"
              style={{ background: "var(--surface)", borderColor: "var(--line)", borderRadius: "var(--r)" }}
            >
              Aucun résultat pour « {query} ». Vérifiez l'orthographe du nom ou cherchez un intitulé de poste.
            </div>
          )}
        </div>
      ) : (
        <ListView
          people={visiblePeople}
          deptById={deptById}
          query={query}
          theme={theme}
          isAdmin={isAdmin}
          onOpen={setSelected}
          onEdit={(p) => { setEditing({ ...p }); setPanel("edit"); }}
        />
      )}

      {!published && isAdmin && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2.5 shadow-lg"
          style={{ background: theme.ink, borderRadius: theme.radius }}
        >
          <span className="text-[12.5px] text-white">
            La base est vide — l'organigramme affiché vient du code.
          </span>
          <button
            onClick={() => persist({})}
            className="h-8 px-3 text-[12.5px] font-semibold"
            style={{ background: theme.accent, color: "#fff", borderRadius: 8 }}
          >
            Publier
          </button>
        </div>
      )}

      {/* Indicateur de sauvegarde */}
      {saveState !== "idle" && (
        <div
          className="absolute bottom-4 right-4 px-3 py-1.5 text-[11px] font-semibold border shadow-sm"
          style={{ background: "var(--surface)", borderColor: "var(--line)", borderRadius: "var(--r)" }}
        >
          {saveState === "saving" && "Enregistrement…"}
          {saveState === "saved" && "Modifications enregistrées"}
          {saveState === "error" && "Échec de l'enregistrement — réessayez"}
        </div>
      )}

      {/* ================= FICHE ================= */}
      {selected && (
        <Drawer onClose={() => setSelected(null)} theme={theme}>
          <PersonDetail
            person={selected}
            people={people}
            deptById={deptById}
            theme={theme}
            isAdmin={isAdmin}
            onEdit={() => { setEditing({ ...selected }); setPanel("edit"); setSelected(null); }}
          />
        </Drawer>
      )}

      {/* ================= PANNEAUX ADMIN ================= */}
      {panel === "code" && (
        <Modal title="Connexion administrateur" onClose={() => setPanel(null)} theme={theme}>
          <LoginForm theme={theme} onOk={() => setPanel(null)} />
        </Modal>
      )}

      {panel === "edit" && editing && (
        <Modal
          title={people.some((p) => p.id === editing.id) ? "Modifier la fiche" : "Nouvelle fiche"}
          onClose={() => { setPanel(null); setEditing(null); }}
          theme={theme}
        >
          <PersonForm
            value={editing}
            people={people}
            departments={departments}
            theme={theme}
            onChange={setEditing}
            onSave={savePerson}
            onDelete={people.some((p) => p.id === editing.id) ? () => { setPanel(null); setPendingDelete(editing); } : null}
          />
        </Modal>
      )}

      {pendingDelete && (
        <Modal title="Supprimer cette fiche" onClose={() => setPendingDelete(null)} theme={theme}>
          <DeleteConfirm
            person={pendingDelete}
            people={people}
            theme={theme}
            onCancel={() => setPendingDelete(null)}
            onConfirm={() => removePerson(pendingDelete.id)}
          />
        </Modal>
      )}

      {panel === "depts" && (
        <Modal title="Équipes" onClose={() => setPanel(null)} theme={theme}>
          <DeptManager
            departments={departments}
            people={people}
            theme={theme}
            onChange={(d) => { setDepartments(d); persist({ departments: d }); }}
          />
        </Modal>
      )}

      {panel === "theme" && (
        <Modal title="Thème" onClose={() => setPanel(null)} theme={theme}>
          <ThemeEditor
            theme={theme}
            onChange={(t) => setTheme(t)}
            onSave={() => { persist({ theme }); setPanel(null); }}
          />
        </Modal>
      )}

      {panel === "import" && (
        <Modal title="Import et export" onClose={() => setPanel(null)} theme={theme}>
          <ImportPanel theme={theme} onImport={importCSV} onExport={exportCSV} />
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Sous-composants
 * ------------------------------------------------------------------ */

const newPerson = (departments) => ({
  id: uid(),
  name: "",
  role: "",
  dept: departments[0]?.id,
  managerId: null,
  type: "person",
  vacant: false,
  note: "",
  comex: false,
  email: "",
  phone: "",
  photo: "",
  linkedin: "",
  also: "",
});

function IconBtn({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="h-8 w-8 grid place-items-center border transition hover:opacity-70 focus:outline-none focus-visible:ring-2"
      style={{ borderRadius: "var(--r)", borderColor: "var(--line)" }}
    >
      {children}
    </button>
  );
}

function Connectors({ tree, geom, line }) {
  const paths = [];
  const walk = (nodes) => {
    for (const n of nodes) {
      const kids = tree.nodeChildren.get(n.id) || [];
      if (!kids.length) continue;
      const p = geom.pos.get(n.id);
      const startY = p.y + p.h;
      const midY = startY + 30;
      paths.push(
        <path key={`v${n.id}`} d={`M ${p.x + CARD_W / 2} ${startY} V ${midY}`} />
      );
      const xs = kids.map((k) => geom.pos.get(k.id).x + CARD_W / 2);
      if (kids.length > 1) {
        paths.push(
          <path key={`h${n.id}`} d={`M ${Math.min(...xs)} ${midY} H ${Math.max(...xs)}`} />
        );
      }
      kids.forEach((k) => {
        const kp = geom.pos.get(k.id);
        paths.push(
          <path key={`d${k.id}`} d={`M ${kp.x + CARD_W / 2} ${midY} V ${kp.y}`} />
        );
      });
      walk(kids);
    }
  };
  walk(tree.rootNodes);
  return (
    <svg
      width={geom.width}
      height={geom.height}
      className="absolute inset-0 pointer-events-none"
      style={{ stroke: line, strokeWidth: 1.5, fill: "none" }}
    >
      {paths}
    </svg>
  );
}

function Avatar({ person, size = 34, showPhoto, theme, ring = false, dept }) {
  const [err, setErr] = useState(false);
  const t = theme || DEFAULT_THEME;
  const hasPhoto = showPhoto && person.photo && !err;

  if (person.vacant) {
    return (
      <div
        className="rounded-full shrink-0"
        style={{ width: size, height: size, background: t.ink }}
        title="Poste en cours de recrutement"
      />
    );
  }

  if (hasPhoto) {
    return (
      <div className="rounded-full shrink-0 overflow-hidden" style={{ width: size, height: size }}>
        <img
          src={person.photo}
          onError={() => setErr(true)}
          alt=""
          className="rounded-full object-cover h-full w-full"
        />
      </div>
    );
  }

  /* En attendant les portraits : initiales sur un disque teinté par l'équipe. */
  const c = dept?.color || t.accent;
  return (
    <div
      className="rounded-full shrink-0 grid place-items-center font-semibold select-none"
      style={{
        width: size,
        height: size,
        background: `color-mix(in srgb, ${c} 13%, #fff)`,
        border: `1.5px solid color-mix(in srgb, ${c} 32%, #fff)`,
        color: c,
        fontSize: Math.round(size * 0.36),
        letterSpacing: "0.01em",
      }}
    >
      {initials(person.name)}
    </div>
  );
}

function Card({ node, x, y, depth, theme, dept, dimmed, isAdmin, onOpen, onToggle, onEdit, onAddReport, onDelete, onMeasure }) {
  const { head, members, kind } = node;
  const [hover, setHover] = useState(false);
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);
  const senior = depth <= 2;

  /* Mesure de la hauteur réellement rendue — offsetHeight ignore le zoom CSS */
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const report = () => onMeasure(node.id, el.offsetHeight);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [node.id, onMeasure, head.role, members.length, node.hasChildren]);

  const mailFor = (p) =>
    p.email ||
    (p.name
      ? `${p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z.]/g, "")}@${theme.emailDomain}`
      : "");

  /* Contrôle de branche, en flux normal dans la carte : rien ne peut déborder */
  const branchBtn = node.hasChildren && (
    <button
      onClick={onToggle}
      title={node.collapsed ? `Déplier — ${node.childCount} rattachement(s) direct(s)` : "Replier la branche"}
      className="shrink-0 flex items-center gap-0.5 pl-2.5 pr-1.5 h-[26px] text-[12px] font-semibold transition hover:opacity-75"
      style={{
        borderRadius: 999,
        background: node.collapsed ? theme.accent : "transparent",
        color: node.collapsed ? "#fff" : "#7A8195",
        border: `1px solid ${node.collapsed ? theme.accent : theme.line}`,
        whiteSpace: "nowrap",
      }}
    >
      {node.childCount}
      {node.collapsed ? <ChevronRight size={13} /> : <ChevronUp size={13} />}
    </button>
  );

  if (kind === "group") {
    return (
      <div
        data-card
        ref={ref}
        className="absolute flex items-start justify-center"
        style={{ left: x, top: y, width: CARD_W, opacity: dimmed ? 0.25 : 1 }}
      >
        <button
          onClick={onToggle}
          className="pb-1 text-[12px] font-bold flex items-center gap-1"
          style={{
            color: theme.accent,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            borderBottom: `2px solid ${theme.accent}`,
          }}
        >
          {head.name}
          {node.hasChildren &&
            (node.collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />)}
        </button>
      </div>
    );
  }

  const shell = {
    background: theme.surface,
    borderRadius: theme.radius,
    border: `1px solid ${hover ? "#C2C9D8" : theme.line}`,
    boxShadow: hover ? "0 10px 26px rgba(11,18,32,0.12)" : "0 2px 8px rgba(11,18,32,0.06)",
    transition: "box-shadow .16s, border-color .16s",
  };

  const portrait = (p, size = AVATAR) => (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <Avatar person={p} size={size} showPhoto={theme.showPhotos} theme={theme} dept={dept} ring />
      {dept && !p.vacant && (
        <span
          className="absolute rounded-full"
          style={{
            top: size * 0.02,
            right: size * 0.02,
            width: Math.round(size * 0.23),
            height: Math.round(size * 0.23),
            background: dept.color,
            border: "2px solid #fff",
          }}
          title={dept.name}
        />
      )}
    </div>
  );

  const target = members.length === 1 ? members[0] : head;
  const adminBtn = isAdmin && (hover || menu) && (
    <button
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => setMenu((v) => !v)}
      className="absolute z-10 right-2 top-2 h-7 w-7 grid place-items-center hover:bg-black/[0.06]"
      style={{ borderRadius: 8 }}
      title="Actions"
    >
      <MoreVertical size={16} className="opacity-55" />
    </button>
  );

  const wrap = (children) => (
    <div
      data-card
      className="absolute"
      style={{ left: x, top: y, width: CARD_W, opacity: dimmed ? 0.25 : 1 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setMenu(false); }}
    >
      <div ref={ref} className="relative" style={shell}>
        {children}
        {adminBtn}
        {menu && (
          <CardMenu
            theme={theme}
            onClose={() => setMenu(false)}
            onEdit={() => { setMenu(false); onEdit(target); }}
            onAddReport={() => { setMenu(false); onAddReport(target); }}
            onDelete={() => { setMenu(false); onDelete(target); }}
          />
        )}
      </div>
    </div>
  );

  const footer = (left) =>
    (left || branchBtn) && (
      <div className="mt-3.5 pt-3 flex items-center gap-2" style={{ borderTop: `1px solid ${theme.line}` }}>
        {left}
        {branchBtn && <div className="ml-auto">{branchBtn}</div>}
      </div>
    );

  /* Poste ouvert */
  if (kind === "vacant") {
    return wrap(
      <div style={{ padding: PAD }}>
        <div className="flex items-start gap-3.5">
          {portrait(head)}
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold leading-[22px] italic" style={{ color: "#8A91A3" }}>
              {head.note ? "À venir" : "Poste ouvert"}
            </p>
            <p className="text-[13.5px] leading-[18px] mt-0.5" style={{ color: senior ? theme.accent : "#5A6274" }}>
              {head.role}
            </p>
            <p className="text-[12.5px] leading-[17px]" style={{ color: "#9AA1B2" }}>
              {head.note || "En cours de recrutement"}
            </p>
          </div>
        </div>
        {footer(null)}
      </div>
    );
  }

  /* Poste partagé */
  if (members.length > 1) {
    return wrap(
      <div style={{ padding: PAD }}>
        <p
          className="text-[12px] font-bold leading-[16px]"
          style={{
            color: senior ? theme.accent : theme.ink,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          {head.role}
        </p>
        <p className="text-[12.5px] leading-[17px] mt-0.5" style={{ color: "#9AA1B2" }}>
          {dept?.name} · {members.length} personnes
        </p>
        <div className="mt-2.5 space-y-0.5">
          {members.map((p) => (
            <button
              key={p.id}
              onClick={() => onOpen(p)}
              className="w-full flex items-center gap-2.5 text-left px-2 -mx-2 hover:bg-black/[0.035]"
              style={{ height: 36, borderRadius: 9 }}
            >
              {portrait(p, 28)}
              <span className="text-[14px] truncate">{p.name}</span>
            </button>
          ))}
        </div>
        {footer(null)}
      </div>
    );
  }

  /* Fiche individuelle */
  const p = members[0];
  return wrap(
    <div style={{ padding: PAD }}>
      <button onClick={() => onOpen(p)} className="flex items-start gap-3.5 text-left w-full">
        {portrait(p)}
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold leading-[22px] truncate">{p.name}</p>
          <p className="text-[13.5px] leading-[18px]" style={{ color: senior ? theme.accent : "#5A6274" }}>
            {head.role}
          </p>
          <p className="text-[12.5px] leading-[17px] flex items-center gap-1.5" style={{ color: "#9AA1B2" }}>
            {dept?.name}
            {p.comex && (
              <span
                className="px-1.5 text-[9.5px] font-bold tracking-wide"
                style={{ background: theme.accent, color: "#fff", borderRadius: 4 }}
              >
                COMEX
              </span>
            )}
          </p>
        </div>
      </button>
      {footer(
        <p
          className="text-[12.5px] truncate min-w-0"
          style={{ color: p.email ? "#5A6274" : "#B4BAC7" }}
          title={mailFor(p)}
        >
          {mailFor(p)}
        </p>
      )}
    </div>
  );
}


function ListView({ people, deptById, query, theme, isAdmin, onOpen, onEdit }) {
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const rows = useMemo(() => {
    const q = norm(query.trim());
    return people
      .filter((p) => p.type === "person")
      .filter((p) => !q || norm(p.name).includes(q) || norm(p.role).includes(q))
      .sort((a, b) => (a.dept || "").localeCompare(b.dept || "") || a.role.localeCompare(b.role));
  }, [people, query]);

  if (!rows.length) {
    return (
      <div className="flex-1 grid place-items-center">
        <p className="text-sm opacity-50">Aucune fiche ne correspond à cette recherche.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0" style={{ background: theme.surface }}>
          <tr className="text-left text-[11px] uppercase tracking-wide opacity-50">
            {["Nom", "Poste", "Équipe", "Rattachement", ""].map((h) => (
              <th key={h} className="font-semibold px-4 py-3 border-b" style={{ borderColor: theme.line }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const d = deptById.get(p.dept);
            const mgr = byId.get(p.managerId);
            return (
              <tr key={p.id} className="border-b hover:bg-black/[0.02]" style={{ borderColor: theme.line }}>
                <td className="px-4 py-2.5">
                  <button onClick={() => onOpen(p)} className="flex items-center gap-2.5 font-medium hover:opacity-60">
                    <Avatar person={p} size={26} showPhoto={theme.showPhotos} theme={theme} dept={d} />
                    {p.name || <span className="italic opacity-50">Poste ouvert</span>}
                  </button>
                </td>
                <td className="px-4 py-2.5">{p.role}</td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ background: d?.color }} />
                    {d?.name}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs opacity-60">{mgr?.name || mgr?.role || "—"}</td>
                <td className="px-4 py-2.5 text-right">
                  {isAdmin && (
                    <button onClick={() => onEdit(p)} className="opacity-40 hover:opacity-90" title="Modifier">
                      <Pencil size={14} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Drawer({ children, onClose, theme }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm h-full overflow-auto border-l shadow-xl"
        style={{ background: theme.surface, borderColor: theme.line }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 opacity-40 hover:opacity-90">
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

function PersonDetail({ person, people, deptById, theme, isAdmin, onEdit }) {
  const d = deptById.get(person.dept);
  const byId = new Map(people.map((p) => [p.id, p]));
  const mgr = byId.get(person.managerId);
  const reports = people.filter((p) => p.managerId === person.id);

  const composed = person.name
    ? `${person.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z.]/g, "")}@${theme.emailDomain}`
    : "";
  const mail = person.email || composed;

  const Row = ({ icon, children, href, muted }) => {
    const body = (
      <>
        <span
          className="h-8 w-8 grid place-items-center shrink-0"
          style={{ background: "rgba(0,0,0,0.045)", borderRadius: 9 }}
        >
          {icon}
        </span>
        <span
          className="text-[13px] truncate"
          style={{ color: muted ? "#A6ADBB" : "inherit" }}
        >
          {children}
        </span>
      </>
    );
    return href ? (
      <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 hover:opacity-65">
        {body}
      </a>
    ) : (
      <div className="flex items-center gap-2.5">{body}</div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-start gap-4">
        <Avatar person={person} size={72} showPhoto={theme.showPhotos} theme={theme} dept={d} ring />
        <div className="min-w-0 pt-1">
          <h2 className="text-lg font-bold leading-tight">
            {person.name || <span className="italic opacity-55">Poste ouvert</span>}
          </h2>
          <p className="text-[13px] font-medium mt-0.5" style={{ color: theme.accent }}>
            {person.role}
          </p>
          <p className="text-[12px] mt-1 inline-flex items-center gap-1.5" style={{ color: "#7A8195" }}>
            <span className="h-2 w-2 rounded-full" style={{ background: d?.color }} />
            {d?.name}
          </p>
        </div>
      </div>

      {person.vacant && (
        <p
          className="mt-4 px-3 py-2 text-[12px] italic"
          style={{ background: "rgba(0,0,0,0.04)", borderRadius: 10, color: "#6B7385" }}
        >
          {person.note || "Poste en cours de recrutement."}
        </p>
      )}

      {!person.vacant && (
        <section className="mt-6">
          <h3 className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "#9AA1B2" }}>
            Contact
          </h3>
          <div className="mt-2.5 space-y-2">
            <Row
              icon={<Mail size={14} className="opacity-60" />}
              href={mail ? `mailto:${mail}` : null}
              muted={!person.email}
            >
              {mail || "—"}
            </Row>
            {person.phone && (
              <Row icon={<Phone size={14} className="opacity-60" />} href={`tel:${person.phone.replace(/\s/g, "")}`}>
                {person.phone}
              </Row>
            )}
            <Row
              icon={<Linkedin size={14} className="opacity-60" />}
              href={person.linkedin || null}
              muted={!person.linkedin}
            >
              {person.linkedin ? "Voir le profil LinkedIn" : "Profil LinkedIn non renseigné"}
            </Row>
          </div>
          {!person.email && (
            <p className="mt-2 text-[11px]" style={{ color: "#A6ADBB" }}>
              Adresse reconstituée à partir du nom — à confirmer.
            </p>
          )}
        </section>
      )}

      <section className="mt-6">
        <h3 className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "#9AA1B2" }}>
          Position
        </h3>
        <dl className="mt-2.5 space-y-3 text-[13px]">
          <div className="flex gap-3">
            <dt className="w-32 shrink-0" style={{ color: "#9AA1B2" }}>Rattaché à</dt>
            <dd>{mgr ? mgr.name || mgr.role : "—"}</dd>
          </div>
          {person.also && (
            <div className="flex gap-3">
              <dt className="w-32 shrink-0" style={{ color: "#9AA1B2" }}>Aussi</dt>
              <dd>{person.also}</dd>
            </div>
          )}
          <div className="flex gap-3">
            <dt className="w-32 shrink-0" style={{ color: "#9AA1B2" }}>
              Rattachements
            </dt>
            <dd className="space-y-1">
              {reports.length === 0 ? (
                <span style={{ color: "#A6ADBB" }}>Aucun</span>
              ) : (
                reports.map((r) => (
                  <p key={r.id}>
                    {r.name || <span className="italic" style={{ color: "#A6ADBB" }}>Poste ouvert</span>}
                    <span style={{ color: "#9AA1B2" }}> — {r.role || r.name}</span>
                  </p>
                ))
              )}
            </dd>
          </div>
        </dl>
      </section>

      {isAdmin && (
        <button
          onClick={onEdit}
          className="mt-7 w-full h-10 text-sm font-semibold text-white flex items-center justify-center gap-2"
          style={{ background: theme.ink, borderRadius: theme.radius }}
        >
          <Pencil size={14} /> Modifier cette fiche
        </button>
      )}
    </div>
  );
}


function Modal({ title, children, onClose, theme }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[88vh] overflow-auto border shadow-xl"
        style={{ background: theme.surface, borderColor: theme.line, borderRadius: theme.radius }}
      >
        <div
          className="sticky top-0 flex items-center justify-between px-5 h-14 border-b"
          style={{ background: theme.surface, borderColor: theme.line }}
        >
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="opacity-40 hover:opacity-90"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide font-semibold opacity-50">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-[11px] opacity-45">{hint}</p>}
    </label>
  );
}

const inputCls = "w-full h-10 px-3 text-sm border outline-none focus:ring-2 focus:ring-black/10";

function LoginForm({ theme, onOk }) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await signIn(email.trim(), pwd);
      onOk();
    } catch (e) {
      setErr(
        /invalid/i.test(e?.message || "")
          ? "Adresse ou mot de passe incorrect."
          : "Connexion impossible. Réessayez dans un instant."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[12.5px] leading-relaxed" style={{ color: "#5A6274" }}>
        Réservé aux personnes chargées de tenir l'organigramme à jour. Les
        comptes sont créés depuis la console Supabase.
      </p>
      <Field label="Adresse email">
        <input
          autoFocus
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErr(""); }}
          className={inputCls}
          style={{ borderRadius: theme.radius, borderColor: theme.line }}
        />
      </Field>
      <Field label="Mot de passe">
        <input
          type="password"
          value={pwd}
          onChange={(e) => { setPwd(e.target.value); setErr(""); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className={inputCls}
          style={{ borderRadius: theme.radius, borderColor: theme.line }}
        />
      </Field>
      {err && <p className="text-xs" style={{ color: "#D02F2F" }}>{err}</p>}
      <button
        onClick={submit}
        disabled={busy || !email || !pwd}
        className="w-full h-10 text-sm font-semibold text-white disabled:opacity-40"
        style={{ background: theme.accent, borderRadius: theme.radius }}
      >
        {busy ? "Connexion…" : "Se connecter"}
      </button>
    </div>
  );
}

function pathOf(id, byId) {
  const out = [];
  let cur = byId.get(id);
  let guard = 0;
  while (cur && guard++ < 40) {
    out.unshift(cur.name || cur.role);
    cur = cur.managerId ? byId.get(cur.managerId) : null;
  }
  return out;
}

function descendantsOf(id, people) {
  const kids = new Map();
  people.forEach((p) => {
    if (!p.managerId) return;
    if (!kids.has(p.managerId)) kids.set(p.managerId, []);
    kids.get(p.managerId).push(p.id);
  });
  const out = new Set();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop();
    for (const k of kids.get(cur) || []) {
      if (out.has(k)) continue;
      out.add(k);
      stack.push(k);
    }
  }
  return out;
}

function ManagerPicker({ value, people, excluded, theme, onPick }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const options = useMemo(() => {
    const n = norm(q.trim());
    return people
      .filter((p) => !excluded.has(p.id))
      .map((p) => ({ p, path: pathOf(p.id, byId) }))
      .filter(({ p, path }) =>
        !n || norm(p.name).includes(n) || norm(p.role).includes(n) || norm(path.join(" ")).includes(n)
      )
      .sort((a, b) => a.path.length - b.path.length || (a.p.name || a.p.role).localeCompare(b.p.name || b.p.role))
      .slice(0, 60);
  }, [q, people, excluded, byId]);

  const current = value ? byId.get(value) : null;
  const currentPath = current ? pathOf(current.id, byId) : [];

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3 py-2.5 text-left border flex items-start gap-2"
        style={{ borderRadius: theme.radius, borderColor: theme.line }}
      >
        <div className="min-w-0 flex-1">
          {current ? (
            <>
              <p className="text-sm font-medium truncate">{current.name || current.role}</p>
              <p className="text-[11px] truncate" style={{ color: "#9AA1B2" }}>
                {currentPath.slice(0, -1).join(" › ") || "Racine"}
                {current.name ? ` · ${current.role}` : ""}
              </p>
            </>
          ) : (
            <p className="text-sm" style={{ color: "#9AA1B2" }}>
              Aucun responsable — placer à la racine
            </p>
          )}
        </div>
        <ChevronDown size={16} className="opacity-40 mt-0.5 shrink-0" />
      </button>

      {open && (
        <div
          className="mt-1.5 border overflow-hidden"
          style={{ borderRadius: theme.radius, borderColor: theme.line }}
        >
          <div className="relative border-b" style={{ borderColor: theme.line }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filtrer par nom, poste ou branche…"
              className="w-full h-10 pl-9 pr-3 text-sm outline-none"
            />
          </div>
          <div className="max-h-64 overflow-auto">
            <button
              onClick={() => { onPick(null); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-black/[0.04]"
              style={{ color: "#9AA1B2" }}
            >
              Aucun — placer à la racine
            </button>
            {options.map(({ p, path }) => (
              <button
                key={p.id}
                onClick={() => { onPick(p.id); setOpen(false); }}
                className="w-full px-3 py-2 text-left hover:bg-black/[0.04] border-t"
                style={{ borderColor: theme.line }}
              >
                <p className="text-[13px] font-medium truncate">
                  {p.name || <span style={{ color: "#9AA1B2" }}>{p.role}</span>}
                  {p.name && <span style={{ color: "#7A8195" }}> — {p.role}</span>}
                </p>
                <p className="text-[11px] truncate" style={{ color: "#A6ADBB" }}>
                  {path.slice(0, -1).join(" › ") || "Racine"}
                </p>
              </button>
            ))}
            {!options.length && (
              <p className="px-3 py-4 text-[13px] text-center" style={{ color: "#9AA1B2" }}>
                Aucune correspondance.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PersonForm({ value, people, departments, theme, onChange, onSave, onDelete }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  const isGroup = value.type === "group";
  const isNew = !people.some((p) => p.id === value.id);
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  /* On ne peut pas se rattacher à soi-même ni à l'un de ses subordonnés :
     cela créerait une boucle et ferait disparaître toute la branche. */
  const excluded = useMemo(() => {
    const d = descendantsOf(value.id, people);
    d.add(value.id);
    return d;
  }, [value.id, people]);

  const mgr = value.managerId ? byId.get(value.managerId) : null;
  const path = mgr ? pathOf(mgr.id, byId) : [];
  const siblings = people.filter(
    (p) => p.managerId === value.managerId && p.id !== value.id && p.type === "person"
  );
  const sameRole = siblings.filter(
    (p) => norm(p.role) === norm(value.role) && value.role.trim() && !p.vacant && !value.vacant
  );
  const dept = departments.find((d) => d.id === value.dept);

  const pickPhoto = (file) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = c.height = 160;
        const ctx = c.getContext("2d");
        const side = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 160, 160);
        set("photo", c.toDataURL("image/webp", 0.8));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[["person", "Personne"], ["group", "Groupe"]].map(([t, l]) => (
          <button
            key={t}
            onClick={() => set("type", t)}
            className="flex-1 h-9 text-xs font-semibold border"
            style={{
              borderRadius: theme.radius,
              borderColor: value.type === t ? theme.ink : theme.line,
              background: value.type === t ? theme.ink : "transparent",
              color: value.type === t ? "#fff" : "inherit",
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <p className="text-[11px] -mt-2" style={{ color: "#9AA1B2" }}>
        Un groupe est une étiquette de regroupement (Wissous, BO / Data, Flux LCD Ikea IDF…) qui porte des rattachements sans correspondre à une personne.
      </p>

      <Field label={isGroup ? "Libellé du groupe" : "Nom"}>
        <input
          autoFocus={isNew}
          value={value.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder={isGroup ? "Wissous" : "Prénom.Initiale"}
          className={inputCls}
          style={{ borderRadius: theme.radius, borderColor: theme.line }}
        />
      </Field>

      {!isGroup && (
        <>
          <Field label="Poste">
            <input
              value={value.role}
              onChange={(e) => set("role", e.target.value)}
              placeholder="Gestionnaire de flotte"
              className={inputCls}
              style={{ borderRadius: theme.radius, borderColor: theme.line }}
            />
          </Field>
          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={!!value.comex}
              onChange={(e) => set("comex", e.target.checked)}
              className="h-4 w-4"
            />
            Membre du COMEX
          </label>
          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={value.vacant}
              onChange={(e) => set("vacant", e.target.checked)}
              className="h-4 w-4"
            />
            Poste en cours de recrutement
          </label>
          {value.vacant && (
            <Field label="Mention affichée" hint="Remplace « En cours de recrutement » sur la carte.">
              <input
                value={value.note || ""}
                onChange={(e) => set("note", e.target.value)}
                placeholder="En cours de recrutement"
                className={inputCls}
                style={{ borderRadius: theme.radius, borderColor: theme.line }}
              />
            </Field>
          )}
        </>
      )}

      <div className="h-px" style={{ background: theme.line }} />

      <Field label="Équipe">
        <div className="flex flex-wrap gap-1.5">
          {departments.map((d) => {
            const on = value.dept === d.id;
            return (
              <button
                key={d.id}
                onClick={() => set("dept", d.id)}
                className="px-2.5 h-7 text-[11.5px] font-semibold border flex items-center gap-1.5"
                style={{
                  borderRadius: 999,
                  borderColor: on ? d.color : theme.line,
                  background: on ? d.color : "transparent",
                  color: on ? "#fff" : "inherit",
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: on ? "#fff" : d.color }} />
                {d.name}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Rattaché à">
        <ManagerPicker
          value={value.managerId}
          people={people}
          excluded={excluded}
          theme={theme}
          onPick={(id) => set("managerId", id)}
        />
      </Field>

      {/* Récapitulatif de placement */}
      <div className="p-3 text-[12px] leading-relaxed" style={{ background: "rgba(0,0,0,0.035)", borderRadius: theme.radius }}>
        <p className="font-semibold mb-1">Position dans l'organigramme</p>
        <p style={{ color: "#5A6274" }}>
          {mgr ? (
            <>
              {[...path.slice(0, -1), <strong key="m">{mgr.name || mgr.role}</strong>].reduce(
                (acc, el, i) => (i ? [...acc, " › ", el] : [el]),
                []
              )}{" "}
              › <em>{value.name || value.role || "cette fiche"}</em>
              <br />
              Niveau {path.length + 1} · équipe {dept?.name}
            </>
          ) : (
            <>Racine de l'organigramme, sans responsable · équipe {dept?.name}</>
          )}
        </p>
        {siblings.length > 0 && (
          <p className="mt-1.5" style={{ color: "#7A8195" }}>
            {siblings.length} personne(s) déjà à ce niveau : {siblings.slice(0, 5).map((p) => p.name || p.role).join(", ")}
            {siblings.length > 5 ? "…" : ""}
          </p>
        )}
        {sameRole.length > 0 && (
          <p className="mt-2 flex gap-2" style={{ color: "#9A6B00" }}>
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>
              {sameRole.map((p) => p.name).join(", ")} occupe(nt) déjà ce poste au même endroit : les fiches seront
              affichées sur une seule carte partagée. Modifiez l'intitulé pour obtenir des cartes distinctes.
            </span>
          </p>
        )}
      </div>

      {!isGroup && (
        <>
          <div className="h-px" style={{ background: theme.line }} />

          <Field label="Photo">
            <div className="flex items-center gap-3">
              {value.photo ? (
                <img src={value.photo} alt="" className="h-14 w-14 rounded-full object-cover shrink-0" />
              ) : (
                <div
                  className="h-14 w-14 rounded-full grid place-items-center shrink-0 text-sm font-semibold"
                  style={{ background: "#F0F2F7", color: "#8A91A3" }}
                >
                  {initials(value.name)}
                </div>
              )}
              <div className="flex-1 flex gap-2">
                <label
                  className="h-9 px-3 flex items-center gap-2 text-[13px] font-semibold border cursor-pointer"
                  style={{ borderRadius: theme.radius, borderColor: theme.line }}
                >
                  <Upload size={14} /> Choisir un fichier
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && pickPhoto(e.target.files[0])}
                  />
                </label>
                {value.photo && (
                  <button
                    onClick={() => set("photo", "")}
                    className="h-9 px-3 text-[13px] border"
                    style={{ borderRadius: theme.radius, borderColor: theme.line, color: "#D02F2F" }}
                  >
                    Retirer
                  </button>
                )}
              </div>
            </div>
            <p className="mt-1.5 text-[11px]" style={{ color: "#9AA1B2" }}>
              Recadrée au centre et réduite à 160px pour rester légère. Sans photo, les initiales s'affichent.
            </p>
          </Field>

          <Field label="Email" hint="Laissé vide, une adresse grisée est composée à partir du nom.">
            <input value={value.email} onChange={(e) => set("email", e.target.value)} className={inputCls} style={{ borderRadius: theme.radius, borderColor: theme.line }} />
          </Field>
          <Field label="Téléphone" hint="Visible uniquement dans la fiche, jamais sur la carte.">
            <input value={value.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} style={{ borderRadius: theme.radius, borderColor: theme.line }} />
          </Field>
          <Field label="LinkedIn (URL)">
            <input value={value.linkedin} onChange={(e) => set("linkedin", e.target.value)} className={inputCls} style={{ borderRadius: theme.radius, borderColor: theme.line }} />
          </Field>
          <Field label="Rattachement secondaire" hint="Texte libre, pour les doubles casquettes.">
            <input value={value.also} onChange={(e) => set("also", e.target.value)} className={inputCls} style={{ borderRadius: theme.radius, borderColor: theme.line }} />
          </Field>
        </>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(value)}
          disabled={!value.name.trim() && !value.role.trim()}
          className="flex-1 h-10 text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: theme.accent, borderRadius: theme.radius }}
        >
          {isNew ? "Ajouter au chart" : "Enregistrer"}
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="h-10 px-3 border"
            style={{ borderRadius: theme.radius, borderColor: theme.line, color: "#D02F2F" }}
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}


function DeleteConfirm({ person, people, theme, onCancel, onConfirm }) {
  const kids = people.filter((p) => p.managerId === person.id);
  const mgr = people.find((p) => p.id === person.managerId);
  return (
    <div className="space-y-4">
      <p className="text-sm">
        <strong>{person.name || person.role}</strong>
        {person.name ? ` — ${person.role}` : ""} sera retiré de l'organigramme.
      </p>

      {kids.length > 0 && (
        <div className="flex gap-2.5 p-3 text-[12.5px] leading-relaxed" style={{ background: "rgba(154,107,0,0.08)", borderRadius: theme.radius, color: "#7A5500" }}>
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              {kids.length} rattachement(s) direct(s) seront remontés d'un niveau
            </p>
            <p className="mt-1">
              {kids.map((k) => k.name || k.role).join(", ")} passeront sous{" "}
              <strong>{mgr ? mgr.name || mgr.role : "la racine de l'organigramme"}</strong>.
            </p>
          </div>
        </div>
      )}

      <p className="text-[12px]" style={{ color: "#9AA1B2" }}>
        La suppression est immédiate et partagée avec toutes les personnes ayant le lien. Exportez le CSV avant si vous souhaitez pouvoir revenir en arrière.
      </p>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 h-10 text-sm font-semibold border"
          style={{ borderRadius: theme.radius, borderColor: theme.line }}
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 h-10 text-sm font-semibold text-white"
          style={{ background: "#D02F2F", borderRadius: theme.radius }}
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}

function DeptManager({ departments, people, theme, onChange }) {
  const count = (id) => people.filter((p) => p.dept === id && p.type === "person").length;
  const update = (id, patch) =>
    onChange(departments.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  return (
    <div className="space-y-3">
      {departments.map((d) => (
        <div key={d.id} className="flex items-center gap-3">
          <input
            type="color"
            value={d.color}
            onChange={(e) => update(d.id, { color: e.target.value })}
            className="h-9 w-9 border cursor-pointer shrink-0"
            style={{ borderRadius: theme.radius, borderColor: theme.line }}
            title="Couleur de l'équipe"
          />
          <input
            value={d.name}
            onChange={(e) => update(d.id, { name: e.target.value })}
            className="flex-1 h-9 px-3 text-sm border outline-none"
            style={{ borderRadius: theme.radius, borderColor: theme.line }}
          />
          <span className="text-[11px] opacity-45 w-14 text-right tabular-nums">
            {count(d.id)} pers.
          </span>
          <button
            onClick={() => {
              if (count(d.id) > 0) {
                alert("Cette équipe compte encore des membres. Réaffectez-les avant de la supprimer.");
                return;
              }
              onChange(departments.filter((x) => x.id !== d.id));
            }}
            className="opacity-35 hover:opacity-90"
            title="Supprimer l'équipe"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...departments, { id: uid(), name: "Nouvelle équipe", color: "#64748B" }])}
        className="w-full h-10 text-sm font-semibold border flex items-center justify-center gap-2"
        style={{ borderRadius: theme.radius, borderColor: theme.line }}
      >
        <Plus size={15} /> Ajouter une équipe
      </button>
    </div>
  );
}

function ThemeEditor({ theme, onChange, onSave }) {
  const set = (k, v) => onChange({ ...theme, [k]: v });
  const swatch = (label, key) => (
    <Field label={label}>
      <div className="flex gap-2">
        <input
          type="color"
          value={theme[key]}
          onChange={(e) => set(key, e.target.value)}
          className="h-10 w-12 border cursor-pointer shrink-0"
          style={{ borderRadius: theme.radius, borderColor: theme.line }}
        />
        <input
          value={theme[key]}
          onChange={(e) => set(key, e.target.value)}
          className={inputCls}
          style={{ borderRadius: theme.radius, borderColor: theme.line }}
        />
      </div>
    </Field>
  );

  return (
    <div className="space-y-4">
      <Field label="Nom affiché">
        <input value={theme.orgName} onChange={(e) => set("orgName", e.target.value)} className={inputCls} style={{ borderRadius: theme.radius, borderColor: theme.line }} />
      </Field>
      <Field label="Logo" hint="Affiché en haut à gauche. Sans logo, le nom s'affiche en toutes lettres.">
        <div className="flex items-center gap-3">
          <div
            className="h-11 px-3 grid place-items-center shrink-0 border"
            style={{ borderRadius: theme.radius, borderColor: theme.line, minWidth: 76 }}
          >
            {theme.logo ? (
              <img src={theme.logo} alt="" className="h-[16px] w-auto" style={{ objectFit: "contain" }} />
            ) : (
              <span className="text-[11px]" style={{ color: "#9AA1B2" }}>aucun</span>
            )}
          </div>
          <label
            className="h-9 px-3 flex items-center gap-2 text-[13px] font-semibold border cursor-pointer"
            style={{ borderRadius: theme.radius, borderColor: theme.line }}
          >
            <Upload size={14} /> Remplacer
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const r = new FileReader();
                r.onload = () => set("logo", r.result);
                r.readAsDataURL(f);
              }}
            />
          </label>
          {theme.logo && (
            <button
              onClick={() => set("logo", "")}
              className="h-9 px-3 text-[13px] border"
              style={{ borderRadius: theme.radius, borderColor: theme.line, color: "#D02F2F" }}
            >
              Retirer
            </button>
          )}
        </div>
      </Field>

      <Field label="Accroche">
        <input value={theme.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputCls} style={{ borderRadius: theme.radius, borderColor: theme.line }} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        {swatch("Couleur principale", "accent")}
        {swatch("Dégradé des portraits", "ring")}
        {swatch("Encre", "ink")}
        {swatch("Fond", "canvas")}
        {swatch("Traits", "line")}
      </div>

      <Field label="Typographie">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(FONTS).map(([k, f]) => (
            <button
              key={k}
              onClick={() => set("font", k)}
              className="h-11 text-sm border"
              style={{
                fontFamily: f.stack,
                borderRadius: theme.radius,
                borderColor: theme.font === k ? theme.ink : theme.line,
                borderWidth: theme.font === k ? 2 : 1,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label={`Arrondi des cartes — ${theme.radius}px`}>
        <input
          type="range" min="0" max="20" value={theme.radius}
          onChange={(e) => set("radius", +e.target.value)}
          className="w-full"
        />
      </Field>

      <div className="space-y-2">
        <label className="flex items-center gap-2.5 text-sm">
          <input type="checkbox" checked={theme.uppercaseRoles} onChange={(e) => set("uppercaseRoles", e.target.checked)} className="h-4 w-4" />
          Intitulés de poste en capitales
        </label>
        <label className="flex items-center gap-2.5 text-sm">
          <input type="checkbox" checked={theme.showPhotos} onChange={(e) => set("showPhotos", e.target.checked)} className="h-4 w-4" />
          Afficher les photos
        </label>
        <label className="flex items-center gap-2.5 text-sm">
          <input type="checkbox" checked={theme.sideband} onChange={(e) => set("sideband", e.target.checked)} className="h-4 w-4" />
          Message d'accueil
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date de mise à jour">
          <input value={theme.updatedAt} onChange={(e) => set("updatedAt", e.target.value)} placeholder="21/08/26" className={inputCls} style={{ borderRadius: theme.radius, borderColor: theme.line }} />
        </Field>
        <Field label="Mise à jour par">
          <input value={theme.updatedBy} onChange={(e) => set("updatedBy", e.target.value)} className={inputCls} style={{ borderRadius: theme.radius, borderColor: theme.line }} />
        </Field>
      </div>

      <Field label="Domaine des adresses email" hint="Sert à composer l'adresse affichée en gris quand aucun email n'est renseigné.">
        <input value={theme.emailDomain} onChange={(e) => set("emailDomain", e.target.value)} className={inputCls} style={{ borderRadius: theme.radius, borderColor: theme.line }} />
      </Field>


      <button
        onClick={onSave}
        className="w-full h-10 text-sm font-semibold text-white"
        style={{ background: theme.accent, borderRadius: theme.radius }}
      >
        Enregistrer le thème
      </button>
    </div>
  );
}

function ImportPanel({ theme, onImport, onExport }) {
  const ref = useRef(null);
  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-sm font-bold">Exporter</h4>
        <p className="text-[12px] opacity-60 mt-1">
          Récupère l'organigramme complet en CSV : sauvegarde, retouche dans un tableur, puis réimport.
        </p>
        <button
          onClick={onExport}
          className="mt-2.5 h-10 px-4 text-sm font-semibold border flex items-center gap-2"
          style={{ borderRadius: theme.radius, borderColor: theme.line }}
        >
          <Download size={15} /> Télécharger le CSV
        </button>
      </div>

      <div className="h-px" style={{ background: theme.line }} />

      <div>
        <h4 className="text-sm font-bold">Importer</h4>
        <p className="text-[12px] opacity-60 mt-1">
          L'import <strong>remplace</strong> l'organigramme existant. Exportez d'abord si vous voulez pouvoir revenir en arrière.
        </p>
        <div
          className="mt-2.5 p-3 text-[11px] font-mono leading-relaxed overflow-x-auto"
          style={{ background: "rgba(0,0,0,0.03)", borderRadius: theme.radius }}
        >
          nom, poste, departement, manager, type, statut, comex,<br />
          email, telephone, photo, linkedin, rattachement_secondaire
        </div>
        <p className="text-[11px] opacity-45 mt-1.5">
          La colonne <code>manager</code> contient le nom exact du responsable. <code>type</code> vaut « personne » ou « groupe ». <code>statut</code> à « En cours de recrutement » marque un poste ouvert.
        </p>
        <input
          ref={ref}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
        />
        <button
          onClick={() => ref.current?.click()}
          className="mt-2.5 h-10 px-4 text-sm font-semibold text-white flex items-center gap-2"
          style={{ background: theme.accent, borderRadius: theme.radius }}
        >
          <Upload size={15} /> Choisir un fichier CSV
        </button>
      </div>

      <div className="h-px" style={{ background: theme.line }} />

      <div className="flex gap-2.5 p-3 text-[12px] leading-relaxed" style={{ background: "rgba(0,0,0,0.03)", borderRadius: theme.radius }}>
        <AlertTriangle size={15} className="shrink-0 mt-0.5 opacity-50" />
        <p className="opacity-70">
          Les modifications sont partagées : toute personne ouvrant ce lien voit
          les mêmes données, y compris les emails et téléphones saisis.
        </p>
      </div>
    </div>
  );
}
