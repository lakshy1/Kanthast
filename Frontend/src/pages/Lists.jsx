import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaRegFileAlt, FaPlay, FaRegImage, FaChevronRight, FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const tabs = ["Biochemistry", "Immunology", "Pharmacology", "Microbiology", "Neuroanatomy"];

const parseLectures = (text) =>
  text
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.*)\((\d{2}:\d{2}(?::\d{2})?)\)$/);
      return match
        ? { title: match[1].trim(), duration: match[2] }
        : { title: line, duration: "--:--" };
    });

const section = (title, total, lectures) => ({
  title,
  total,
  id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  lectures: parseLectures(lectures),
});

const biochemistrySections = [
  section(
    "Vitamins",
    "03:13:39",
    `Vitamin B1 (Thiamine) Biochemistry(07:19)
Vitamin B1 (Thiamine) Deficiency(10:51)
Vitamin B2 (Riboflavin)(06:30)
Vitamin B3 (Niacin) Biochemistry(07:50)
Vitamin B3 (Niacin) Deficiency and Excess(08:32)
Hartnup Disease(05:58)
Vitamin B5 (Pantothenic Acid)(05:33)
Vitamin B6 (Pyridoxine)(10:15)
Vitamin B7 (Biotin)(07:52)
Vitamin B9 (Folate)(03:39)
Vitamin B12 (Cobalamin) Biochemistry(07:02)
Vitamins B9 and B12 Deficiencies(20:08)
Vitamin A (Retinol) Biochemistry(09:24)
Vitamin A (Retinol) Deficiency and Excess(09:16)
Vitamin C (Ascorbic Acid) Biochemistry(08:06)
Vitamin C (Ascorbic Acid) Deficiency and Excess(09:01)
Vitamin D Biochemistry(11:42)
Vitamin D Deficiency and Excess(11:37)
Vitamin E (Tocopherol/Tocotrienol)(07:23)
Vitamin K Biochemistry(06:53)
Vitamin K Deficiency(06:34)
Zinc(06:06)
Kwashiorkor and Marasmus(05:57)`
  ),
  section(
    "Biochemical Pathways",
    "04:56:45",
    `Glycolysis(20:00)
Citric Acid Cycle (TCA Cycle)(20:01)
Electron Transport Chain (ETC)(19:58)
Cori Cycle(06:40)
De Novo Purine Synthesis(08:48)
De Novo Pyrimidine Synthesis(21:03)
Purine Salvage(11:31)
Purine Excretion(09:34)
Ethanol Metabolism(12:40)
Pyruvate Metabolism(11:12)
HMP Shunt (Pentose Phosphate Pathway)(11:58)
Galactose Metabolism(11:14)
Sorbitol (Polyol) Pathway(10:17)
Urea Cycle(12:58)
Alanine (Cahill) Cycle(11:15)
Catecholamine Synthesis & Breakdown(19:00)
Homocysteine Metabolism(09:29)
Fatty Acid Synthesis (Citrate Shuttle)(05:07)
Fatty Acid Breakdown (Carnitine Shuttle)(07:00)
Propionic Acid Pathway(11:10)
Fructose Metabolism(07:55)
Regulation by Fructose-2,6-Bisphosphate (F-2,6-BP)(09:28)
Glycogenesis(10:45)
Glycogenolysis(17:30)`
  ),
  section(
    "Metabolic Disorders",
    "02:33:29",
    `Albinism(05:39)
Pyruvate Dehydrogenase Deficiency(05:48)
Pyruvate Kinase Deficiency(08:13)
G6PD Deficiency(13:07)
Essential Fructosuria(03:48)
Hereditary Fructose Intolerance(07:07)
Galactosemia(12:01)
Galactokinase Deficiency(06:16)
Lactase Deficiency(10:03)
Ornithine Transcarbamylase Deficiency(07:10)
Phenylketonuria (PKU)(08:52)
Maple Syrup Urine Disease(06:54)
Alkaptonuria(06:35)
Homocystinuria(10:09)
Cystinuria(07:37)
Propionic Acidemia(07:53)
Lesch-Nyhan Syndrome(06:48)
Systemic Primary Carnitine Deficiency(10:03)
MCAD Deficiency(09:13)`
  ),
  section(
    "Lipids",
    "01:12:22",
    `Chylomicron Metabolism(13:14)
VLDL Metabolism(16:18)
HDL Metabolism(05:27)
Abetalipoproteinemia(08:00)
Familial Hyperchylomicronemia(07:48)
Familial Hypercholesterolemia(08:24)
Familial Dysbetalipoproteinemia(08:11)
Familial Hypertriglyceridemia(04:58)`
  ),
  section(
    "Autosomal Dominant Diseases",
    "59:56",
    `Marfan Syndrome(04:45)
Li-Fraumeni Syndrome (LFS)(05:03)
Achondroplasia(04:13)
Job (Hyper IgE) Syndrome(04:21)
HHT(03:45)
Hereditary Spherocytosis(06:42)
von Hippel-Lindau (VHL)(04:35)
MEN 1(05:01)
MEN 2(04:29)
Von Recklinghausen Disease (NF I)(04:21)
Neurofibromatosis Type II (NF II)(02:17)
Myotonic Dystrophy(03:50)
ADPKD(06:27)`
  ),
  section(
    "Lysosomal Storage Diseases",
    "42:55",
    `Krabbe Disease(04:43)
Hurler and Hunter Syndromes(07:53)
Fabry Disease(05:32)
Tay-Sachs and Niemann-Pick(07:15)
Gaucher Disease(03:53)
Metachromatic Leukodystrophy(04:45)
I-Cell Disease(08:52)`
  ),
  section(
    "Glycogen Storage Diseases",
    "20:26",
    `Pompe Disease (Type II)(05:15)
Von Gierke (Type I)(05:05)
Cori Disease (Type III)(05:00)
McArdle Disease (Type V)(05:06)`
  ),
  section(
    "Chromosomal Abnormalities",
    "57:07",
    `Down Syndrome (Trisomy 21)(10:52)
Edwards Syndrome (Trisomy 18)(07:53)
Patau Syndrome (Trisomy 13)(06:22)
Klinefelter Syndrome(07:09)
Turner Syndrome(08:43)
Williams Syndrome(06:58)
Cri du Chat Syndrome(03:38)
Imprinting(05:30)`
  ),
  section(
    "Collagen Related Disorders",
    "47:43",
    `Alport Syndrome(05:38)
Menkes Disease(07:31)
Osteogenesis Imperfecta (Brittle Bone Disease)(06:49)
Collagen Synthesis(11:45)
Ehlers-Danlos Syndrome(09:45)
Goodpasture Syndrome(06:12)`
  ),
  section(
    "DNA Repair",
    "27:56",
    `Lynch Syndrome(09:40)
Xeroderma Pigmentosum(05:53)
Ataxia-Telangiectasia(07:44)
Bloom Syndrome(04:39)`
  ),
  section(
    "Lung Cancer",
    "23:02",
    `Lung Cancer Overview(06:30)
Small Cell Carcinoma(05:31)
Adenocarcinoma(03:45)
Squamous Cell Carcinoma(02:52)
Large Cell Carcinoma(02:13)
Bronchial Carcinoid Tumor(02:08)`
  ),
  section(
    "Toxicology",
    "52:54",
    `Cyanide Poisoning(10:09)
Tetrodotoxin(06:22)
Methanol Poisoning(06:32)
Ethylene Glycol Poisoning(08:09)
Ciguatoxin (Ciguatera Fish Poisoning)(05:46)
Spoiled Fish (Scombroid) Poisoning(04:42)
Carbon Monoxide Poisoning(11:11)
Amanita Phalloides(00:00)`
  ),
  section(
    "Vasculitides",
    "01:31:19",
    `Giant Cell (Temporal) Arteritis(12:03)
Henoch-Schonlein Purpura(08:41)
Takayasu Arteritis(10:11)
Buerger Disease (Thromboangiitis Obliterans)(08:52)
Behcet Disease(09:13)
Granulomatosis with Polyangiitis(14:05)
Mixed Cryoglobulinemia(07:29)
Microscopic Polyangiitis(11:22)
Kawasaki Disease(09:18)`
  ),
  section(
    "Peroxisome",
    "19:44",
    `Zellweger Syndrome(04:09)
Adrenoleukodystrophy(06:16)
Refsum Disease(09:18)`
  ),
  section(
    "Mitochondrial Diseases",
    "13:18",
    `Leber Hereditary Optic Neuropathy(03:48)
Mitochondrial Myopathies(09:30)`
  ),
  section(
    "Heme and Porphyrias",
    "33:20",
    `Heme Synthesis(17:51)
Acute Intermittent Porphyria (AIP)(08:52)
Porphyria Cutanea Tarda (PCT)(06:35)`
  ),
  section(
    "Coagulation",
    "59:56",
    `Common Pathway of Coagulation(10:54)
Extrinsic Pathway of Coagulation(07:29)
Intrinsic Pathway of Coagulation(16:50)
Hemophilia A(07:10)
Hemophilia B(05:15)
Hemophilia C(05:16)
Factor V Leiden(06:58)
Antithrombin-3 Deficiency(00:00)`
  ),
  section(
    "Platelet Disorders",
    "51:45",
    `Platelet Plug Formation(12:20)
Bernard-Soulier Syndrome(07:25)
Glanzmann Thrombasthenia(03:57)
Immune Thrombocytopenic Purpura (ITP)(09:24)
Thrombotic Thrombocytopenic Purpura (TTP)(10:09)
Hemolytic Uremic Syndrome (HUS)(08:29)
Disseminated Intravascular Coagulation (In Progress)(00:00)
Von Willebrand Disease (In Progress)(00:00)`
  ),
  section(
    "Plasma Cell Dyscrasias",
    "19:50",
    `Waldenstrom Macroglobulinemia(08:24)
Multiple Myeloma(11:26)`
  ),
  section(
    "Developmental Milestones",
    "40:04",
    `2 Months(03:26)
4 Months(03:35)
6 Months(04:27)
9 Months(04:30)
12 Months(03:23)
18 Months(03:07)
2 Years(05:45)
3 Years(04:27)
4 Years(04:06)
5 Years(03:16)`
  ),
  section(
    "Lab Diagrams",
    "37:52",
    `BMP (Chem7) Fishbone(07:41)
CBC(07:05)
Coagulation Panel(08:38)
CMP(08:13)
ABG(06:15)`
  ),
  section(
    "Misc",
    "02:27:45",
    `Osteosarcoma(10:09)
McCune-Albright Syndrome(08:16)
Hexokinase vs Glucokinase(14:20)
COP I & II and Clathrin(07:29)
Kartagener Syndrome (Primary Ciliary Dyskinesia)(08:33)
Familial Adenomatous Polyposis (FAP)(10:26)
Peutz-Jeghers Syndrome(08:03)
Cystic Fibrosis Overview(08:32)
Cystic Fibrosis Complications(13:03)
Medicare vs Medicaid(11:33)
Duchenne and Becker Muscular Dystrophy(11:08)
Yolk Sac Tumor(04:07)
Rett Syndrome(04:30)
Fragile X Syndrome(08:18)
Whipple's Disease(06:04)
Osteoid Osteoma vs Osteoblastoma(08:39)
T1 vs T2 MRIs(04:25)`
  ),
  section(
    "Dyslipidemias (deprecated)",
    "21:56",
    `Apolipoproteins(07:29)
Hyperchylomicronemia(03:55)
Hypercholesterolemia(04:52)
Dysbetalipoproteinemia(02:53)
Hypertriglyceridemia(02:45)
Abetalipoproteinemia(00:00)`
  ),
];

const immunologySections = [
  section(
    "Immunoglobulins",
    "34:34",
    `Immunoglobulin A (IgA)(06:45)
Immunoglobulin G (IgG)(08:55)
Immunoglobulin M (IgM)(07:05)
Immunoglobulin E (IgE)(09:22)
Immunoglobulin D (IgD)(02:25)`
  ),
  section(
    "Complement",
    "32:26",
    `Common Complement Pathway(13:41)
Classical Complement Pathway(07:03)
Alternative Complement Pathway(05:57)
Lectin Complement Pathway(05:44)`
  ),
  section(
    "Other Cell Types",
    "01:41:15",
    `Neutrophils - Overview(11:31)
Neutrophils - Granules(09:34)
Neutrophils - Oxidative Burst(11:03)
Basophils(08:20)
Eosinophils(11:37)
Mast Cells(14:20)
Monocytes / Macrophages(16:26)
Natural Killer (NK) Cells(13:07)
Dendritic Cells(05:11)`
  ),
  section(
    "B Cells and T Cells",
    "02:06:00",
    `MHC I(07:55)
MHC II(10:13)
B Cells - Overview(06:47)
B Cells - Activation(09:24)
Plasma B Cells(05:47)
Memory B Cells(05:27)
T Cells - Overview(03:30)
T Cells - Activation(09:33)
T Cells - Differentation(14:56)
Cytotoxic (Killer) T Cells(06:30)
Helper T Cells - Overview(06:42)
Th1 Cells(10:15)
Th2 Cells(11:14)
Th17 Cells(06:27)
Regulatory T Cells (Tregs)(11:15)`
  ),
  section(
    "Cytokines",
    "01:04:01",
    `TNF-alpha(06:03)
IL-1(07:07)
IL-2(06:34)
IL-3(02:40)
IL-4(05:53)
IL-5(05:08)
IL-6(05:29)
IL-8(02:29)
IL-10(03:26)
IL-12(04:30)
TGF-beta(03:31)
IFN-alpha and IFN-beta(02:54)
IFN-gamma(08:09)`
  ),
  section(
    "Immunodeficiencies",
    "01:24:43",
    `Selective IgA Deficiency(05:27)
Chediak-Higashi Syndrome(10:09)
DiGeorge Syndrome(10:06)
Bruton (X-linked) Agammaglobulinemia(09:05)
Hyper-IgM Syndrome(08:35)
IPEX(07:09)
Leukocyte Adhesion Deficiency (LAD)(09:40)
Chronic Granulomatous Disease (CGD)(07:50)
IL-12 Receptor Deficiency(08:58)
Wiskott-Aldrich Syndrome(07:39)`
  ),
  section(
    "Leukemias and Lymphomas",
    "01:54:19",
    `Acute Myelogenous Leukemia (AML)(07:15)
Acute Promyelocytic Leukemia (APL)(10:54)
Acute Lymphocytic Leukemia (ALL)(14:39)
Chronic Myelogenous Leukemia (CML)(10:43)
Chronic Lymphocytic Leukemia (CLL)(06:52)
Hairy Cell Leukemia (HCL)(08:24)
Hodgkin Lymphoma(06:52)
Burkitt Lymphoma(06:34)
Diffuse Large B Cell Lymphoma (DLBCL)(04:50)
Follicular Lymphoma(08:11)
Mantle Cell Lymphoma(08:16)
Marginal Zone Lymphoma(05:27)
Primary CNS Lymphoma (PCNSL)(04:26)
Adult T-Cell Leukemia/Lymphoma (ATLL)(04:58)
Mycosis Fungoides / Sezary Syndrome(05:54)`
  ),
  section(
    "Hypersensitivity Reactions",
    "28:37",
    `Type 1 Hypersensitivity Reactions(09:41)
Type 2 Hypersensitivity Reactions(07:32)
Type 3 Hypersensitivity Reactions(06:06)
Type 4 Hypersensitivity Reactions(05:15)`
  ),
  section(
    "Immunosuppressants",
    "30:14",
    `Cyclosporine(08:50)
Tacrolimus(06:39)
Sirolimus (Rapamycin)(06:43)
Basiliximab(03:47)
Mycophenolate(04:13)`
  ),
  section(
    "Transfusion Reactions",
    "27:00",
    `Anaphylactic Transfusion Reactions(04:35)
Acute Hemolytic Transfusion Reaction(10:56)
Febrile Nonhemolytic Transfusion Reaction(05:54)
TRALI(05:33)`
  ),
  section(
    "Transplant Rejection",
    "26:48",
    `Hyperacute Transplant Rejection(05:00)
Acute Transplant Rejection(05:29)
Chronic Transplant Rejection(07:15)
Graft vs Host Disease (GVHD)(09:03)`
  ),
];

const pharmacologySections = [
  section(
    "Diabetes Drugs (New)",
    "03:05:44",
    `DPP-4 Inhibitors(14:13)
GLP-1 Analogs(11:54)
Insulin Overview(17:09)
Insulin Preparations(21:56)
Metformin (Biguanides)(18:00)
TZDs (Thiazolidinediones)(16:48)
Sulfonylureas(22:12)
Meglitinides(14:59)
SGLT2 Inhibitors(17:56)
Alpha-Glucosidase Inhibitors(18:15)
Pramlintide (Amylin Analogs)(12:16)`
  ),
  section(
    "Antiarrhythmic Drugs (New)",
    "03:39:27",
    `Adenosine(14:11)
Class 3 Antiarrhythmics - Dofetilide & Ibutilide(14:03)
Class 1A Antiarrhythmics(23:12)
Class 1B Antiarrhythmics(17:26)
Class 1C Antiarrhythmics(24:52)
Class 2 Antiarrhythmics(30:01)
Sotalol(20:52)
Class 3 Antiarrhythmics - Amiodarone(24:34)
Class 4 Antiarrhythmics(25:07)
Digoxin(25:04)`
  ),
  section(
    "Cardiovascular Drugs (New)",
    "01:51:35",
    `Ivabradine(10:10)
Nitroprusside(09:45)
DHP Calcium Channel Blockers(17:18)
Hydralazine(16:08)
Fenoldopam(10:51)
Nitrates(23:12)
Ranolazine(08:13)
Sacubitril(15:54)`
  ),
  section(
    "Lipid Lowering Drugs (New)",
    "01:32:46",
    `Fish Oil(10:00)
Statins(17:11)
Ezetimibe(09:56)
Fibrates(13:34)
Niacin(14:33)
Bile Acid Resins(15:04)
PCSK9 Inhibitors(12:26)`
  ),
  section(
    "Sympathomimetics and Sympatholytics (New)",
    "01:25:12",
    `Isoproterenol(10:03)
Dobutamine(12:48)
Norepinephrine(09:50)
Alpha-Methyldopa(07:10)
Midodrine(07:29)
Clonidine & Guanfacine(09:24)
Phenylephrine(09:52)
Epinephrine(06:58)
Dopamine(11:35)`
  ),
  section(
    "Alpha & Beta Blockers (New)",
    "01:01:22",
    `Phentolamine(08:41)
Phenoxybenzamine(05:58)
-osin Drugs(06:55)
Beta-1 Selective Beta Blockers(05:15)
Non-Selective Beta Blockers(05:47)
Dual Alpha Beta Blockers(04:50)
Nebivolol(02:38)
Clinical Use of Beta Blockers(14:57)
Side Effects of Beta Blockers(06:16)`
  ),
  section(
    "Renal Drugs (New)",
    "01:14:26",
    `Aliskiren(09:28)
Mannitol(10:43)
Thiazide Diuretics(16:35)
ACE Inhibitors(19:29)
ARBs(18:11)`
  ),
  section(
    "Antiepileptics (New)",
    "01:12:46",
    `Ethosuximide(00:00)
Levetiracetam(06:53)
Gabapentinoids(06:12)
Valproate(13:37)
Benzodiazepine Drug Names(08:18)
Benzodiazepine Clinical Uses(09:33)
Benzodiazepine Mechanisms and Side Effects(10:01)
Topiramate(09:07)
Lamotrigine(09:03)`
  ),
  section(
    "Psych Drugs (New)",
    "02:28:59",
    `Mirtazapine(08:20)
Vortioxetine(06:48)
Bupropion(09:13)
Trazodone(08:35)
Vilazodone(05:48)
Buspirone(05:52)
Buprenorphine(03:40)
Serotonin Syndrome(10:26)
Neuroleptic Malignant Syndrome (NMS)(10:16)
Typical Antipsychotics(07:26)
Atypical Antipsychotics(17:48)
Nicotine Replacement Therapies(04:36)
SSRIs(13:11)
Varenicline(04:27)
Alcohol Use Disorder Treatments(10:10)
Naloxone(07:21)
Naltrexone(04:48)
CNS Stimulants(10:01)`
  ),
  section(
    "Oncology Drugs (New)",
    "40:10",
    `General Chemo Side Effects(05:39)
Busulfan(05:57)
Cladribine & Pentostatin(08:41)
Taxanes(06:42)
Platinum Compounds(08:18)
Trastuzumab(04:51)`
  ),
  section(
    "General Pharm",
    "01:44:29",
    `Gs / Gi Pathway(07:59)
Gq Signaling Pathway(07:50)
Alpha-1 (Adrenergic) Receptors(06:30)
Alpha-2 (Adrenergic) Receptors(07:41)
Beta-1 (Adrenergic) Receptors(06:24)
Beta-2 (Adrenergic) Receptors(08:39)
Beta-3 (Adrenergic) Receptors(02:15)
M1 (Muscarinic) Receptors(06:02)
M2 (Muscarinic) Receptors(05:48)
M3 (Muscarinic) Receptors(10:56)
D1 (Dopamine) Receptors(06:00)
D2 (Dopamine) Receptors(06:28)
H1 (Histamine) Receptors(07:50)
H2 (Histamine) Receptors(03:59)
V1 (Vasopressin) Receptors(03:49)
V2 (Vasopressin) Receptors(06:14)`
  ),
  section(
    "Cholinomimetics",
    "50:25",
    `Bethanechol(03:19)
Carbachol(04:05)
Methacholine(03:39)
Pilocarpine(04:21)
Donepezil Rivastigmine and Galantamine(05:06)
Edrophonium(09:05)
Neostigmine(08:37)
Physostigmine(06:20)
Pyridostigmine(05:47)`
  ),
  section(
    "Anticholinergics",
    "21:25",
    `Atropine (Homatropine and Tropicamide)(06:03)
Glycopyrrolate(03:53)
Hyoscyamine & Dicyclomine(03:27)
Oxybutynin Solifenacin Tolterodine(04:19)
Scopolamine(03:39)`
  ),
  section(
    "Sympathomimetics and Sympatholytics (Old)",
    "01:05:14",
    `Dopamine(09:31)
Fenoldopam(05:23)
Dobutamine(04:19)
Epinephrine(09:15)
Norepinephrine(08:13)
Isoproterenol(04:26)
Midodrine(03:00)
Phenylephrine and Pseudoephedrine(07:15)
(Alpha) Methyldopa(04:48)
Clonidine (and Guanfacine)(05:37)
Tizanidine(03:23)`
  ),
  section(
    "Alpha and Beta Blockers (Old)",
    "46:51",
    `Phenoxybenzamine(04:42)
Phentolamine(06:50)
Alpha-1 Antagonists (Prazosin, Terazosin, Tamsulosin)(08:01)
Beta-1 Selective Blockers (Atenolol, Esmolol, Metoprolol)(06:55)
Combined Alpha-Beta Blockers (Carvedilol, Labetalol)(07:10)
Non-selective Beta-Blockers (Propranolol, Timolol)(06:39)
Nebivolol(06:30)`
  ),
  section(
    "Cardiovascular Pharm (Old)",
    "02:51:52",
    `Adenosine(08:31)
Magnesium(05:00)
Nitroprusside(06:12)
Nitrates(11:38)
Ivabradine(06:30)
Digoxin/Digitalis(10:40)
Class IA Antiarrhythmics(09:05)
Class IB Antiarrhythmics(10:40)
Class IC Antiarrhythmics(08:09)
Class II Antiarrhythmics(09:20)
Class III Antiarrhythmics - Amiodarone(09:24)
Class III Antiarrythmics - Sotalol(07:07)
Class III Antiarrhythmics - Ibutilide, Dofetilide(07:29)
Class IV Antiarrhythmics - Verapamil, Diltiazem(08:01)
HMG-CoA Reductase Inhibitors (Statins)(05:49)
Ezetimibe(04:19)
Fibrates(11:05)
PCSK9 Inhibitors (Alirocumab, Evolocumab)(04:57)
Fish Oil and Omega-3s(04:32)
Milrinone(04:01)
Aliskiren(03:04)
Hydralazine(07:24)
Ranolazine(03:48)
Sacubitril(04:56)`
  ),
  section(
    "Diabetes Drugs (Old)",
    "01:16:34",
    `Insulin Preparations(12:32)
Metformin(09:04)
Glitazones / Thiazolidinediones(08:00)
First-Gen Sulfonylureas(08:30)
Second-Gen Sulfonylureas(06:29)
Meglitinides(09:24)
GLP-1 Analogs(06:50)
DPP-4 Inhibitors(04:44)
alpha-Glucosidase Inhibitors(06:32)
Pramlintide(04:26)`
  ),
  section(
    "Other Endocrine Pharm",
    "38:50",
    `Thionamides (PTU vs Methimazole)(09:07)
ADH Antagonists (Conivaptan, Tolvaptan)(04:36)
Levothyroxine (T4) vs Liothyronine (T3)(05:56)
Demeclocycline(04:50)
Desmopressin(07:05)
Cinacalcet(03:30)
Sevelamer(03:44)`
  ),
  section(
    "Gastrointestinal Pharm",
    "01:18:03",
    `H2 Blockers (Cimetidine, Ranitidine, Famotidine)(06:55)
Proton Pump Inhibitors (PPIs)(07:19)
Misoprostol(07:13)
Orlistat(05:22)
Antacids(08:39)
Bismuth & Sucralfate(03:57)
Octreotide(08:09)
Diphenoxylate vs. Loperamide(05:43)
Ondansetron(06:15)
Metoclopramide(06:31)
Bulk-forming Laxatives(02:52)
Senna(03:54)
Docusate(02:13)
Aprepitant(02:54)`
  ),
  section(
    "Heme Pharm",
    "01:24:03",
    `Warfarin(17:31)
Heparin(09:48)
Low Molecular Weight Heparins (LMWH)(08:32)
Direct Thrombin Inhibitors (Argatroban, Dabigatran, Bivalirudin)(08:54)
Thrombolytics (tPA, Streptokinase, Urokinase)(08:32)
ADP Receptor Inhibitors(07:02)
PDE3 Inhibitors (Cilostazol, Dipyridamole)(09:15)
Glycoprotein IIb/IIIa Inhibitors(06:33)
Factor Xa Inhibitors (Apixaban, Rivaroxaban, Edoxaban)(07:50)`
  ),
  section(
    "Oncology Pharm",
    "02:05:53",
    `Bleomycin(05:39)
Dactinomycin, Actinomycin D(03:56)
Doxorubicin, Daunorubicin(07:10)
Azathioprine, 6-MP(08:30)
Cladribine(04:34)
Cytarabine(06:03)
Busulfan(04:45)
Cyclophosphamide, Ifosfamide(05:13)
Nitrosoureas(05:03)
Paclitaxel(04:40)
Vincristine, Vinblastine(04:04)
Cisplatin, Carboplatin, Oxaliplatin(05:22)
Etoposide, Teniposide(04:04)
Irinotecan, Topotecan(04:51)
Bevacizumab(04:03)
Erlotinib(03:14)
Cetuximab, Panitumumab(03:53)
Imatinib, Dasatinib(07:25)
Rituximab(03:40)
Bortezomib, Carfilzomib(03:59)
Trastuzumab(04:55)
Dabrafenib, Vemurafenib(03:56)
Raloxifene and Tamoxifen(07:19)
Hydroxyurea(04:31)
Procarbazine(04:52)`
  ),
  section(
    "Musculoskeletal Pharm",
    "01:44:38",
    `Aspirin(10:06)
Acetaminophen(05:46)
N-Acetylcysteine (NAC)(04:40)
Celecoxib(07:09)
NSAIDs(10:51)
Leflunomide(04:45)
Bisphosphonates(06:00)
Teriparatide(07:57)
Cyclobenzaprine(04:10)
Dantrolene(06:33)
Etanercept(06:57)
TNF Inhibitors (Infliximab, Adalimumab. Certolizumab, Golimumab)(05:43)
Allopurinol/Febuxostat(07:46)
Probenecid(06:29)
Colchicine(05:20)
Rasburicase(04:24)`
  ),
  section(
    "Antiepileptics",
    "01:03:54",
    `Valproic Acid (Valproate)(08:45)
Carbamazepine(12:03)
Ethosuximide(05:06)
Gabapentin(07:09)
Lamotrigine(06:30)
Levetiracetam(03:35)
Barbituates (Phenobarbital, Thiopental)(09:33)
Topiramate(06:32)
Vigabatrin(04:37)`
  ),
  section(
    "Anesthetics",
    "56:41",
    `Ketamine(03:57)
Nitrous Oxide (N2O)(10:22)
Local Anesthetics(10:48)
Nondepolarizing Neuromuscular-blocking Drugs(07:07)
Succinylcholine(00:00)
Halothane and Fluranes(14:23)
Propofol(03:48)
Thiopental(06:13)`
  ),
  section(
    "Other Neuro Pharm",
    "02:14:30",
    `Ramelteon(03:17)
Triptans(07:18)
Benzodiazepines - Function(10:43)
Zolpidem Zaleplon Eszopiclone(04:14)
Suvorexant(04:40)
Bromocriptine (Ergot Dopamine Agonists)(06:57)
Pramipexole, Ropinirole(07:18)
Amantadine(06:26)
Levodopa, Carbidopa(10:05)
Entacapone, Tolcapone(07:15)
Selegiline and Rasagiline(06:45)
Benztropine, Trihexyphenidyl(06:03)
Tetrabenazine(03:12)
Baclofen(03:19)
Memantine(03:56)
Riluzole(03:09)
Full Opioid Agonists(11:53)
Partial Opioid Agonists(08:43)
Dextromethorphan(02:48)
Tramadol(06:14)
Naloxone(05:08)
Naltrexone(04:58)`
  ),
  section(
    "Psych Pharm",
    "02:14:20",
    `Lithium(06:55)
Typical Antipsychotics(21:35)
Atypical Antipsychotics(19:30)
SSRIs(12:03)
SNRIs(10:45)
Tricyclic Antidepressants (TCAs)(11:37)
Monoamine Oxidase Inhibitors (MAOIs)(07:30)
Bupropion(07:28)
Mirtazapine(07:55)
Trazadone(08:45)
Vilazodone(04:58)
Vortioxetine(05:36)
Buspirone(05:46)
Varenicline(03:52)`
  ),
  section(
    "Renal Pharm",
    "01:39:09",
    `ACE Inhibitors(10:56)
Aldosterone Receptor Blockers (Spironolactone, Eplerenone)(14:18)
Ethacrynic Acid(06:22)
Loop Diuretics (Furosemide, Bumetanide, Torsemide)(12:56)
Mannitol(08:29)
Acetazolamide(10:13)
ENaC Blockers (Amiloride, Triamterene)(09:39)
Thiazide Diuretics(15:09)
Angiotensin II Receptor Blockers (ARBs)(11:05)`
  ),
  section(
    "Reproductive Pharm",
    "01:25:53",
    `Leuprolide(08:00)
Anastrozole(05:12)
Estrogens(08:01)
Clomiphene(05:48)
Progestins(11:00)
Mifepristone(05:36)
Copper IUDs(03:44)
Danazol(03:48)
Terbutaline, Ritodrine(06:08)
Minoxidil(05:12)
Androgens (Testosterone, Methyltestosterone)(07:39)
Flutamide(04:35)
PDE-5 Inhibitors (Sildenafil, Vardenafil, Tadalafil)(07:19)
Finasteride(03:47)`
  ),
  section(
    "Respiratory Pharm",
    "01:01:38",
    `Ipratropium vs Tiotropium(05:59)
1st Generation Antihistamines(09:54)
2nd-Generation Antihistamines(05:42)
Albuterol vs Salmeterol(06:52)
Fluticasone & Budesonide(05:28)
Montelukast & Zafirlukast(04:04)
Zileuton(04:37)
Omalizumab(03:09)
Cromolyn & Nedocromil(03:35)
Guaifenesin(03:26)
Endothelin Receptor Antagonists (Bosentan)(04:34)
Prostaglandin Analogs (Epoprostenol, Iloprost)(04:14)
Theophylline(00:00)`
  ),
];

const microbiologySections = [
  section(
    "Antibiotics / Antiparasitics",
    "03:45:43",
    `Penicillin Overview(16:50)
Penicillinase-Sensitive vs. Penicillinase-Resistant Penicillins(10:20)
Anti-Pseudomonal Penicillins(07:11)
Cephalosporins Overview(09:37)
1st Generation Cephalosporins(05:51)
2nd Generation Cephalosporins(05:47)
3rd Generation Cephalosporins(08:33)
4th Generation Cephalosporins(04:50)
5th Generation Cephalosporins(05:59)
Carbapenems(06:55)
Monobactams (Aztreonam)(06:18)
Vancomycin(08:27)
Aminoglycosides(08:47)
Tetracyclines(12:46)
Tigecycline(05:37)
Chloramphenicol(06:55)
Clindamycin(05:06)
Linezolid(05:15)
Macrolides(10:38)
Polymyxins(06:44)
Sulfonamides(00:00)
Dapsone(09:18)
Trimethoprim(00:00)
Fluoroquinolones(11:18)
Daptomycin(05:41)
Metronidazole(04:50)
Rifamycins (Rifampin, Rifabutin)(07:48)
Isoniazid(13:24)
Pyrazinamide(05:27)
Ethambutol(05:35)
Chloroquine(03:46)`
  ),
  section(
    "Antifungals",
    "57:35",
    `Amphotericin B(13:35)
Nystatin(05:44)
Flucytosine(06:09)
Azoles(09:01)
Terbinafine(07:18)
Echinocandins(06:57)
Griseofulvin(08:48)`
  ),
  section(
    "Antivirals",
    "02:02:58",
    `Oseltamivir, Zanamivir(06:16)
Acyclovir (Famciclovir, Valacyclovir)(09:22)
Ganciclovir(10:01)
Foscarnet(14:07)
Cidofovir(08:41)
NRTIs(20:47)
NNRTIs(13:26)
Integrase Inhibitors(06:37)
Protease Inhibitors(11:18)
Entry Inhibitors (Enfuvirtide, Maraviroc)(07:24)
NS5A Inhibitors(04:24)
NS5B Inhibitors(05:15)
NS3/4A Inhibitors(05:16)`
  ),
  section(
    "Bacteria - Gram Positive",
    "03:23:04",
    `Staph aureus: Overview(12:16)
Staph aureus: Presentation(11:22)
Methicillin-Resistant Staph aureus (MRSA)(05:16)
Staph saprophyticus(06:20)
Strep pneumoniae: Overview(07:45)
Strep pneumoniae: Presentation(07:30)
Strep viridans(07:26)
Strep pyogenes: Overview(11:46)
Strep pyogenes: Presentation(11:07)
Strep agalactiae(10:45)
Strep bovis(06:34)
Enterococcus(00:00)
Bacillus anthracis(12:14)
Bacillus cereus(06:30)
Clostridium tetani(10:07)
Clostridium perfringens(12:11)
Clostridium botulinum(10:18)
Clostridium difficile(10:31)
Corynebacterium diphtheriae(13:55)
Listeria monocytogenes(09:24)
Nocardia(12:50)
Actinomyces(06:43)`
  ),
  section(
    "Bacteria - Gram Negative",
    "04:53:59",
    `Neisseria spp: Overview(10:36)
Neisseria gonorrhoeae(09:48)
Neisseria meningitidis(11:26)
Haemophilus influenzae(10:40)
Bordetella pertussis(08:24)
Brucella(05:48)
Legionella pneumophila(12:54)
Pseudomonas aeruginosa: Overview (07:57)
Pseudomonas aeruginosa: Disease(11:22)
Salmonella Overview(08:34)
Salmonella typhi(08:20)
Salmonella enteritidis(04:16)
Shigella(09:43)
Yersinia enterocolitica(10:37)
Escherichia coli: Overview(11:11)
Enterohemorrhagic E. Coli (EHEC)(06:55)
Enterotoxigenic E. Coli (ETEC)(06:07)
Klebsiella pneumoniae(08:41)
Campylobacter jejuni(09:20)
Vibrio spp.(10:58)
Helicobacter pylori(12:41)
Borrelia burgdorferi (Lyme Disease)(10:35)
Leptospira interrogans(06:55)
Treponema pallidum: Overview(16:35)
Treponema pallidum: Diagnosis(07:48)
Congenital syphilis(05:29)
Chlamydia: Overview(08:15)
Chlamydia trachomatis(09:54)
Chlamydia pneumoniae vs. psittaci(03:59)
Rickettsia rickettsii(06:00)
Rickettsia typhi vs. prowazekii(07:03)
Anaplasma vs. Ehrlichia(07:16)
Coxiella burnetii (Q fever)(07:36)`
  ),
  section(
    "Bacteria - Gram Indeterminate",
    "01:10:25",
    `Mycobacterium tuberculosis: Overview(11:54)
Mycobacterium tuberculosis: Disease (TB)(20:18)
Mycobacterium avium(05:00)
Mycobacterium scrofulaceum(04:31)
Mycobacterium leprae(09:03)
Gardnerella vaginalis (Bacterial Vaginosis)(07:08)
Mycoplasma pneumoniae(12:28)`
  ),
  section(
    "Viruses - DNA Viruses",
    "01:58:49",
    `Herpesvirus Overview(04:16)
Herpes Simplex Virus 1 (HSV1)(12:40)
Herpes Simplex Virus 2 (HSV2)(08:20)
Varicella-Zoster Virus (HHV3)(13:13)
Epstein-Barr Virus (HHV4)(10:28)
Cytomegalovirus (HHV5)(10:36)
Human Herpesviruses 6 and 7 (HHV6 and HHV7)(04:16)
Human Herpesviruses 8 (HHV8)(05:58)
Poxvirus(11:13)
Hepadnavirus(00:00)
Adenovirus(10:31)
Papillomavirus (HPV)(07:21)
Polyomavirus(06:37)
Parvovirus(13:14)`
  ),
  section(
    "Viruses - RNA Viruses",
    "04:46:01",
    `HIV: Microbiology and Characteristics(21:33)
HIV: Clinical Course(18:52)
Reovirus(07:02)
Picornavirus Overview(05:10)
Poliovirus(09:49)
Echovirus(03:59)
Rhinovirus(05:07)
Coxsackievirus(06:06)
Hepatitis A Virus (HAV)(09:18)
Hepevirus (Hepatitis E Virus)(07:30)
Calicivirus(06:37)
Flavivirus(05:37)
Hepatitis C Virus (HCV)(11:43)
Yellow Fever Virus(06:47)
Dengue Virus(09:39)
St. Louis Encephalitis and West Nile Virus(04:36)
Zika Virus(04:39)
Togavirus(07:10)
Rubella(11:52)
Retrovirus(08:52)
Coronavirus(11:42)
Orthomyxovirus(17:18)
Paramyxovirus(09:28)
Respiratory Syncytial Virus (RSV)(05:46)
Parainfluenza Virus (Croup)(04:32)
Measles(08:35)
Mumps(07:58)
Rhabdovirus(12:33)
Filovirus(07:52)
Arenavirus(10:36)
Bunyavirus(08:30)
Deltavirus(09:03)`
  ),
  section(
    "Fungi",
    "02:00:12",
    `Histoplasma(07:50)
Blastomyces(07:53)
Coccidioides(11:37)
Paracoccidioides(13:35)
Tinea (Dermatophytes)(00:00)
Malassezia(07:52)
Candida albicans(14:14)
Aspergillus fumigatus(16:26)
Cryptococcus neoformans(12:15)
Mucor and Rhizopus(09:45)
Pneumocystis jirovecii(09:36)
Sporothrix schenckii(09:04)`
  ),
  section(
    "Parasites",
    "04:05:54",
    `Giardia lamblia(09:10)
Toxoplasma gondii(14:20)
Entamoeba histolytica(08:18)
Cryptosporidium(05:11)
Naegleria fowleri(07:34)
Trypanosoma brucei(08:20)
Plasmodium Overview(15:19)
Plasmodium Disease (Malaria)(14:03)
Babesia(12:28)
Trypanosoma cruzi(08:58)
Leishmania(12:01)
Trichomonas vaginalis(05:53)
Enterobius vermicularis (pinworm)(08:13)
Ascaris lumbricoides (giant roundworm)(09:08)
Strongyloides stercoralis (threadworm)(10:42)
Ancylostoma and Necator(09:40)
Trichinella spiralis(07:05)
Trichuris trichiura (whipworm)(07:18)
Toxocara canis(07:04)
Onchocerca volvulus(05:22)
Loa loa(05:35)
Wuchereria bancrofti(05:03)
Taenia solium(08:11)
Diphyllobothrium latum(05:52)
Echinococcus granulosus(07:03)
Schistosoma(12:53)
Clonorchis sinensis(03:47)
Sarcoptes scabiei (Scabies)(05:30)
Pediculus humanis and Phthirus pubis (Lice)(05:42)`
  ),
];

const neuroanatomySections = [
  section(
    "Cranial Nerves",
    "01:58:04",
    `Olfactory Nerve (CN I)(05:48)
Optic Nerve (CN II)(07:04)
Oculomotor Nerve (CN III)(12:00)
Trochlear Nerve (CN IV)(07:00)
Trigeminal Nerve (CN V)(17:48)
Abducens Nerve (CN VI)(07:21)
Facial Nerve (CN VII)(15:53)
Vestibulocochlear Nerve (CN VIII)(10:09)
Glossopharyngeal Nerve (CN IX)(11:46)
Vagus Nerve (CN X)(12:20)
Accessory Nerve (CN XI)(05:48)
Hypoglossal Nerve (CN XII)(04:58)`
  ),
  section(
    "Spinal Tracts",
    "55:08",
    `Dorsal Column (Medial Lemniscus)(16:18)
Spinothalamic Tract(15:21)
Corticospinal Tract(10:43)
Brachial Plexus(12:46)`
  ),
  section(
    "Thalamic Nuclei",
    "25:45",
    `Ventral Posterolateral (VPL) Nucleus(05:38)
Ventral Posteromedial (VPM) Nucleus(05:17)
Lateral Geniculate Nucleus (LGN)(04:39)
Medial Geniculate Nucleus (MGN)(05:17)
Ventral Lateral (VL) Nucleus(04:50)`
  ),
  section(
    "Hypothalamic Nuclei",
    "28:01",
    `Suprachiasmatic Nucleus(02:53)
Paraventricular and Supraoptic Nuclei(05:21)
Lateral Nucleus(03:57)
Ventromedial Nucleus(04:37)
Anterior Nucleus(03:13)
Posterior Nucleus(03:32)
Preoptic Nuclei(04:25)`
  ),
  section(
    "Vagal Nuclei",
    "11:42",
    `Nucleus Ambiguus(03:30)
Nucleus Tractus Solitarius(05:26)
Dorsal Motor Nucleus(02:46)`
  ),
  section(
    "Mechanoreceptors",
    "18:36",
    `Pacinian Corpuscle (Lamellar Corpuscle)(05:13)
Meissner Corpuscle (Tactile Corpuscle)(04:50)
Merkel Disk(05:26)
Ruffini Endings (Ruffini Corpuscle)(03:07)`
  ),
  section(
    "Headaches",
    "29:52",
    `Tension Headache(06:30)
Trigeminal Neuralgia(04:58)
Migraine Headaches(11:45)
Cluster Headache(06:37)`
  ),
  section(
    "Brain Tumors",
    "01:26:30",
    `Craniopharyngioma(08:09)
Oligodendroglioma(05:48)
Schwannoma(09:08)
Glioblastoma Multiforme (Grade IV Astrocytoma)(07:07)
Meningioma(07:53)
Ependymoma(07:03)
Pinealoma(04:39)
Pilocytic Astrocytoma(08:11)
Medulloblastoma(11:05)
Pituitary Adenoma(11:03)
Hemangioblastoma(06:19)`
  ),
  section(
    "Dopaminergic Pathways",
    "18:18",
    `Mesocortical Pathway(05:17)
Mesolimbic Pathway(04:30)
Nigrostriatal Pathway(04:51)
Tuberoinfundibular Pathway(03:39)`
  ),
  section(
    "Strokes",
    "54:30",
    `Anterior Cerebral Artery (ACA)(04:50)
Middle Cerebral Artery (MCA)(09:20)
Posterior Cerebral Artery (PCA)(05:47)
Lenticulostriate Artery(05:52)
Anterior Inferior Cerebellar Artery (AICA)(09:10)
Posterior Inferior Cerebellar Artery (PICA)(08:37)
Anterior Spinal Artery (ASA)(05:28)
Basilar Artery(05:26)`
  ),
  section(
    "Hemorrhage",
    "33:53",
    `Epidural Hematoma(10:15)
Subdural Hematoma(09:20)
Subarachnoid Hemorrhage(09:15)
Charcot-Bouchard Microaneurysms(05:03)`
  ),
  section(
    "Neurodegenerative Diseases",
    "55:25",
    `Alzheimer Dementia(13:18)
Vascular Dementia(03:37)
Lewy Body Dementia(05:53)
Frontotemporal Dementia(05:41)
Parkinson Disease(10:15)
Multiple System Atrophy(04:50)
Progressive Supranuclear Palsy(04:51)
Creutzfeldt-Jakob Disease(06:59)`
  ),
  section(
    "Posterior Fossa Malformations",
    "19:15",
    `Chiari I Malformation(05:44)
Chiari II Malformation(07:26)
Dandy-Walker Malformation(06:04)`
  ),
  section(
    "Neurological Disorders",
    "01:07:44",
    `Tuberous Sclerosis(09:52)
Charcot-Marie-Tooth Disease(07:34)
Huntington Disease(10:35)
Sturge-Weber Syndrome(07:25)
Friedreich Ataxia(12:40)
Multiple Sclerosis (MS)(15:45)
Horner Syndrome(03:49)`
  ),
  section(
    "Spinal Lesions",
    "48:35",
    `UMN vs. LMN Lesions(09:45)
Werdnig-Hoffman Disease (SMA Type 1)(07:53)
Amyotrophic Lateral Sclerosis (ALS)(05:20)
Tabes Dorsalis(06:52)
Cauda Equina Syndrome(04:44)
Syringomyelia(05:35)
Brown-Sequard Syndrome(08:24)`
  ),
];

const modules = {
  Biochemistry: {
    totalDuration: "26:25:15",
    sections: biochemistrySections,
  },
  Immunology: {
    totalDuration: "11:09:59",
    sections: immunologySections,
  },
  Pharmacology: {
    totalDuration: "44:57:06",
    sections: pharmacologySections,
  },
  Microbiology: {
    totalDuration: "29:04:41",
    sections: microbiologySections,
  },
  Neuroanatomy: {
    totalDuration: "11:11:25",
    sections: neuroanatomySections,
  },
};

export default function Lists() {
  const [activeTab, setActiveTab] = useState("Biochemistry");
  const sectionRefs = useRef({});
  const navigate = useNavigate();
  const activeModule = useMemo(() => modules[activeTab], [activeTab]);

  const jumpTo = (sectionId) => {
    const target = sectionRefs.current[sectionId];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openLectureResource = (resourceType, sectionTitle, lecture) => {
    const params = new URLSearchParams({
      module: activeTab,
      section: sectionTitle,
      title: lecture.title,
      duration: lecture.duration,
    });

    navigate(`/${resourceType}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_20%,_#f5f7ff,_#edf2ff_35%,_#eef4ff_70%)] px-4 md:px-8 py-8">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-3">
            {tabs.map((tab, index) => (
              <motion.button
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.35, ease: "easeOut" }}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 rounded-2xl border text-lg font-bold transition ${
                  activeTab === tab
                    ? "bg-white shadow-md border-slate-200 text-slate-900"
                    : "bg-transparent border-slate-300 text-slate-700 hover:bg-white/70"
                }`}
              >
                {tab}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
          <div className="space-y-8">
            <div className="px-2">
              <h1 className="text-5xl font-black text-slate-900">
                {activeTab}{" "}
                <span className="text-4xl text-slate-500 font-medium">({activeModule.totalDuration})</span>
              </h1>
            </div>

            {activeModule.sections.map((sec, sectionIndex) => (
              <motion.section
                key={sec.id}
                ref={(el) => {
                  sectionRefs.current[sec.id] = el;
                }}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: sectionIndex * 0.015, duration: 0.45, ease: "easeOut" }}
                className="scroll-mt-24"
              >
                <div className="rounded-3xl bg-white/80 border border-slate-200 p-6 md:p-7 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900">
                    {sec.title} <span className="text-3xl text-slate-500 font-medium">({sec.total})</span>
                  </h2>

                  <div className="mt-6 space-y-2">
                    {sec.lectures.map((lecture, lectureIndex) => (
                      <div
                        key={`${sec.id}-${lecture.title}-${lectureIndex}`}
                        className="rounded-2xl px-4 py-3 hover:bg-slate-50 transition-colors duration-300"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="pr-2">
                            <p className="text-[1.65rem] leading-tight font-medium text-slate-800">{lecture.title}</p>
                            <p className="text-sm text-slate-500 mt-1">({lecture.duration})</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <ActionButton
                              label="Summary"
                              icon={<FaRegFileAlt />}
                              onClick={() => openLectureResource("summary", sec.title, lecture)}
                            />
                            <ActionButton
                              label="Video"
                              icon={<FaPlay />}
                              locked={lectureIndex >= 2}
                              onClick={() => openLectureResource("video", sec.title, lecture)}
                            />
                            <ActionButton
                              label="Photo"
                              icon={<FaRegImage />}
                              locked={lectureIndex >= 2}
                              onClick={() => openLectureResource("images", sec.title, lecture)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>
            ))}
          </div>

          <aside className="self-start lg:sticky lg:top-24 overflow-visible h-fit">
            <div className="rounded-3xl bg-[#f4f2fa] border border-[#d8d3e7] p-6 shadow-[0_15px_35px_rgba(76,29,149,0.12)] overflow-visible">
              <p className="text-xl font-semibold text-slate-900 mb-4">Jump to:</p>
              <div className="space-y-2">
                {activeModule.sections.map((sec) => (
                  <button
                    key={`jump-${sec.id}`}
                    onClick={() => jumpTo(sec.id)}
                    className="w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-slate-800 font-semibold hover:bg-white/85 transition"
                  >
                    <span>{sec.title}</span>
                    <FaChevronRight className="text-xs text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, locked = false }) {
  const lockedMessage = "Subscribe to access all the content";

  return (
    <div className="relative group/lock">
      <motion.button
        whileHover={locked ? undefined : { scale: 1.06, y: -1 }}
        whileTap={locked ? undefined : { scale: 0.95 }}
        onClick={locked ? undefined : onClick}
        className={`relative w-11 h-11 rounded-full border bg-white/90 transition flex items-center justify-center ${
          locked
            ? "border-slate-300 text-slate-400 cursor-not-allowed"
            : "border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-500"
        }`}
        aria-label={label}
        title={locked ? lockedMessage : label}
        type="button"
      >
        {icon}
        {locked && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-800 text-white text-[9px] grid place-items-center">
            <FaLock />
          </span>
        )}
      </motion.button>

      {locked && (
        <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 group-hover/lock:opacity-100 transition">
          {lockedMessage}
        </span>
      )}
    </div>
  );
}
