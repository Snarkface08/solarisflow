document.addEventListener('DOMContentLoaded', () => {
    try {
        // --- 1. RIFERIMENTI DOM E STATO ---

        // Librerie
        window.jsPDF = window.jspdf.jsPDF;
        // La libreria autoTable si attacca all'oggetto window.jspdf

        // Input Dati Cliente
        const inClientName = document.getElementById('client-name');
        const inClientAddress = document.getElementById('client-address');
        const inProfiloConsumo = document.getElementById('profilo-consumo');
        const inConsumoF1 = document.getElementById('consumo-f1');
        const inConsumoF2 = document.getElementById('consumo-f2');
        const inConsumoF3 = document.getElementById('consumo-f3');
        
        // Input Ingegneristici
        const inAreaGeografica = document.getElementById('area-geografica');
        const inPotenzaInstallata = document.getElementById('potenza-pv-installata');
        const inPotenzaInverter = document.getElementById('potenza-inverter-installato');
        
        // Input Impianto
        const inCostoImpianto = document.getElementById('costo-totale-impianto');
        const inTipoSistema = document.getElementById('tipo-sistema');
        const inAccumuloInstallato = document.getElementById('accumulo-installato');
        const inEfficienzaBatteria = document.getElementById('efficienza-batteria');
        
        // Input Finanziari
        const inCostoEnergIA = document.getElementById('costo-energia');
        const inCostiFissi = document.getElementById('costi-fissi-bolletta');
        const inInflazione = document.getElementById('inflazione-annua');
        const inDegrado = document.getElementById('degrado-annuo');
        const inSimulazioneAnni = document.getElementById('simulazione-anni');
        
        // Input O&M
        const inCostoManutenzione = document.getElementById('costo-manutenzione-annua');
        const inCostoSostituzioneInverter = document.getElementById('costo-sostituzione-inverter');
        const inAnnoSostituzioneInverter = document.getElementById('anno-sostituzione-inverter');
        
        // Input Incentivi
        const inPercPNRR = document.getElementById('perc-pnrr');
        const inTariffaCER = document.getElementById('tariffa-cer');
        const inPercCondivisa = document.getElementById('perc-energia-condivisa-cer');
        const inPrezzoRID = document.getElementById('prezzo-rid');

        // Liste Input
        const allNumberInputs = document.querySelectorAll('#calculator-form input[type="number"]');
        const allTextInputs = document.querySelectorAll('#calculator-form input[type="text"]');
        const allSelects = document.querySelectorAll('#calculator-form select');

        // Output UI
        const outConsumoAnnuoTotale = document.getElementById('consumo-annuo-totale');
        const outPotenzaConsigliata = document.getElementById('potenza-consigliata-result'); 
        const outProduzioneConsigliata = document.getElementById('produzione-consigliata-result');
        const outConsiglioAccumulo = document.getElementById('accumulo-consigliato-result');
        const outConsiglioAccumuloRagione = document.getElementById('accumulo-consigliato-ragione');
        const outSituazioneConsumo = document.getElementById('situazione-consumo-totale');
        const outSituazioneCosto = document.getElementById('situazione-costo-attuale');
        const outPanoPotenza = document.getElementById('panoramica-potenza');
        const outPanoAccumulo = document.getElementById('panoramica-accumulo');
        const outPanoProduzione = document.getElementById('panoramica-produzione');
        const outPanoProduzioneNota = document.getElementById('panoramica-produzione-nota');
        const outPanoCostoImpianto = document.getElementById('panoramica-costo-impianto');
        const outPanoIncentivoPNRR = document.getElementById('panoramica-incentivo-pnrr');
        const outPanoCostoReale = document.getElementById('panoramica-costo-reale');
        const outPanoRisparmio1 = document.getElementById('panoramica-risparmio-anno1');
        const outPanoGuadagno1 = document.getElementById('panoramica-guadagno-anno1');
        const outPanoTotale1 = document.getElementById('panoramica-totale-anno1');
        const outMassimaleApplicato = document.getElementById('massimale-applicato-result');

        // KPI
        const kpiPayback = document.getElementById('payback-result');
        const kpiBenefit = document.getElementById('benefit-result');
        const kpiTotalGain = document.getElementById('total-gain-result');
        const outTotalGainLabel = document.getElementById('total-gain-label');
        const outTableTitle = document.getElementById('table-title');
        const outPaybackTableTitle = document.getElementById('payback-table-title');

        // Pulsanti
        const calculateBtn = document.getElementById('calculate-btn');
        const toggleDetailsBtn = document.getElementById('toggle-details-btn');
        const hideDetailsBtnBottom = document.getElementById('hide-details-btn-bottom');
        const resetBtn = document.getElementById('reset-btn');
        
        // NUOVI RIFERIMENTI EXPORT
        const inIncludeDetails = document.getElementById('include-details-in-summary');
        const exportSummaryPdfBtn = document.getElementById('export-summary-pdf-btn');
        const exportDetailsPdfBtn = document.getElementById('export-details-pdf-btn');


        // Sezioni
        const detailsSection = document.getElementById('calcoli-dettaglio');
        const detailsContent = document.getElementById('calcoli-dettaglio-content');

        // Tabella e Grafico
        const tableBody = document.getElementById('payback-table-body');
        const ctx = document.getElementById('payback-chart').getContext('2d');
        let paybackChart = null;

        // Stato Applicazione
        let calcoliEseguiti = false;
        let pdfResults = {}; 

        // --- 2. COSTANTI INGEGNERISTICHE (Il Cervello V6) ---

        const GIORNI_MESE = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        
        const PROFILI_TERNA = {
            nord:   [0.032, 0.048, 0.080, 0.099, 0.118, 0.125, 0.120, 0.109, 0.088, 0.065, 0.041, 0.035],
            centro: [0.038, 0.050, 0.081, 0.098, 0.115, 0.121, 0.123, 0.115, 0.095, 0.073, 0.049, 0.042],
            sud:    [0.042, 0.053, 0.082, 0.097, 0.112, 0.118, 0.124, 0.119, 0.099, 0.080, 0.055, 0.049]
        };
        const PROFILI_TERNA_NOMI = { nord: "Nord", centro: "Centro", sud: "Sud e Isole" };

        const RIF_PRODUZIONE_IDEALE = {
            nord: 1200,
            centro: 1350,
            sud: 1450
        };

        const MATRICE_CLIPPING = {
            nord:   { "1.0": 0.000, "1.1": 0.005, "1.2": 0.010, "1.3": 0.015, "1.4": 0.020, "1.5": 0.025, "1.6": 0.030, "1.7": 0.035, "1.8": 0.040, "1.9": 0.045, "2.0": 0.050 },
            centro: { "1.0": 0.000, "1.1": 0.010, "1.2": 0.015, "1.3": 0.025, "1.4": 0.035, "1.5": 0.045, "1.6": 0.055, "1.7": 0.065, "1.8": 0.075, "1.9": 0.085, "2.0": 0.095 },
            sud:    { "1.0": 0.000, "1.1": 0.015, "1.2": 0.025, "1.3": 0.040, "1.4": 0.055, "1.5": 0.070, "1.6": 0.085, "1.7": 0.100, "1.8": 0.115, "1.9": 0.130, "2.0": 0.145 }
        };
        const MATRICE_CLIPPING_MAX_KEY = "2.0";

        function normalize(arr) {
            const sum = arr.reduce((a, b) => a + b, 0);
            return arr.map(val => val / sum);
        }

        const PROFILI_CONSUMO = {
            costante:       [1/12, 1/12, 1/12, 1/12, 1/12, 1/12, 1/12, 1/12, 1/12, 1/12, 1/12, 1/12],
            picco_invernale: normalize([1.4, 1.3, 1.1, 1.0, 0.8, 0.7, 0.7, 0.8, 1.0, 1.1, 1.3, 1.4]),
            picco_estivo:    normalize([0.8, 0.8, 0.9, 1.0, 1.1, 1.3, 1.5, 1.5, 1.1, 1.0, 0.8, 0.8]),
            doppio_picco:    normalize([1.2, 1.1, 1.0, 0.9, 0.9, 1.1, 1.3, 1.3, 1.0, 0.9, 1.1, 1.2]),
            ufficio:         normalize([1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.0, 0.5, 1.1, 1.1, 1.1, 1.1]),
            ristorazione:    normalize([0.7, 0.8, 0.9, 1.0, 1.2, 1.4, 1.5, 1.5, 1.3, 1.0, 0.9, 0.8])
        };
        const PROFILI_CONSUMO_NOMI = {
            costante: "Residenziale - Consumo Costante",
            picco_invernale: "Residenziale - Picco Invernale (Risc.)",
            picco_estivo: "Residenziale - Picco Estivo (A/C)",
            doppio_picco: "Residenziale - Doppio Picco (Risc. + A/C)",
            ufficio: "Commerciale - Ufficio",
            ristorazione: "Commerciale - Ristorazione/Hotel"
        };

        const defaultValues = {
            'client-name': '', 'client-address': '',
            'profilo-consumo': 'costante',
            'consumo-f1': '1500', 'consumo-f2': '1800', 'consumo-f3': '1700',
            'area-geografica': 'centro',
            'potenza-pv-installata': '6', 'potenza-inverter-installato': '6',
            'costo-totale-impianto': '12000',
            'tipo-sistema': 'standard-ac',
            'accumulo-installato': '0',
            'efficienza-batteria': '85',
            'costo-energia': '0.25', 'costi-fissi-bolletta': '120',
            'inflazione-annua': '2', 'degrado-annuo': '0.5',
            'simulazione-anni': '20',
            'costo-manutenzione-annua': '100', 'costo-sostituzione-inverter': '1500', 'anno-sostituzione-inverter': '12',
            'perc-pnrr': '40', 'tariffa-cer': '0.11',
            'perc-energia-condivisa-cer': '70', 'prezzo-rid': '0.08'
        };

        // --- 3. LOGICA DI CALCOLO (Il "Cervello V6") ---

        function getClippingLoss(area, ratio) {
            if (ratio <= 1.0) return 0.0;
            const ratioKey = (Math.min(2.0, Math.round(ratio * 10) / 10)).toFixed(1);
            const areaMatrix = MATRICE_CLIPPING[area];
            return areaMatrix[ratioKey] || areaMatrix[MATRICE_CLIPPING_MAX_KEY];
        }

        function calculateNetProduction(inputs) {
            if (inputs.potenzaInverter <= 0) return { 
                produzioneAnnuaNetta: 0, produzioneTeorica: 0, perditaClippingPct: 0,
                ratio: 0, nota: "Inverter 0 kW" 
            };

            const rifIdeale = RIF_PRODUZIONE_IDEALE[inputs.areaGeografica];
            const produzioneTeorica = inputs.potenzaInstallata * rifIdeale;
            const ratio = inputs.potenzaInstallata / inputs.potenzaInverter;
            let perditaClippingPct = getClippingLoss(inputs.areaGeografica, ratio);
            let nota = `Stima con ${(perditaClippingPct*100).toFixed(1)}% perdita clipping.`;

            if (inputs.tipoSistema === 'ibrido-dc' && inputs.accumuloInstallato > 0) {
                const perditaSalvata = perditaClippingPct * 0.70; // Stima 70% salvato
                perditaClippingPct -= perditaSalvata;
                nota = `Clipping ridotto da batteria Ibrida (stima -${(perditaClippingPct*100).toFixed(1)}%).`
            }

            const produzioneAnnuaNetta = produzioneTeorica * (1 - perditaClippingPct);
            
            return {
                produzioneAnnuaNetta,
                produzioneTeorica,
                perditaClippingPct,
                ratio,
                nota,
                rifIdeale // Esportiamo per i dettagli
            };
        }

        function calculateFinancials(inputs) {
            
            const productionData = calculateNetProduction(inputs);
            const produzioneAnnuaNetta = productionData.produzioneAnnuaNetta;
            
            const consumoTotale = inputs.consumoF1 + inputs.consumoF2 + inputs.consumoF3;
            const costoAttualeAnnuo = (consumoTotale * inputs.costoQuotaEnergia) + inputs.costiFissiBolletta;
            
            let totaleAutoconsumoAnno = 0;
            let totaleImmissioneAnno = 0;
            let totalePrelievoAnno = 0;
            let totaleAutoIstantaneo = 0;
            let totaleAutoBatteria = 0;

            const profiloProd = PROFILI_TERNA[inputs.areaGeografica];
            const profiloCons = PROFILI_CONSUMO[inputs.profiloConsumo];

            for (let mese = 0; mese < 12; mese++) {
                const produzioneMese = produzioneAnnuaNetta * profiloProd[mese];
                const consumoF1Mese = inputs.consumoF1 * profiloCons[mese];
                const consumoF2F3Mese = (inputs.consumoF2 + inputs.consumoF3) * profiloCons[mese];
                
                const giorni = GIORNI_MESE[mese];
                const prodGiorno = produzioneMese / giorni;
                const consF1Giorno = consumoF1Mese / giorni;
                const consF2F3Giorno = consumoF2F3Mese / giorni;

                const autoIstantaneo = Math.min(prodGiorno, consF1Giorno);
                const eccessoPerBatteria = prodGiorno - autoIstantaneo;
                
                let energiaCaricata = 0;
                let autoBatteria = 0;
                let immissioneGiorno = eccessoPerBatteria; 

                if (inputs.accumuloInstallato > 0) {
                    energiaCaricata = Math.min(eccessoPerBatteria, inputs.accumuloInstallato);
                    immissioneGiorno = eccessoPerBatteria - energiaCaricata; 
                    
                    const fabbisognoNotte = consF2F3Giorno;
                    const disponibileDaBatteria = energiaCaricata * inputs.efficienzaBatteria;
                    autoBatteria = Math.min(fabbisognoNotte, disponibileDaBatteria);
                }

                const prelievoGiorno = (consF1Giorno - autoIstantaneo) + (consF2F3Giorno - autoBatteria);

                totaleAutoIstantaneo += autoIstantaneo * giorni;
                totaleAutoBatteria += autoBatteria * giorni;
                totaleImmissioneAnno += immissioneGiorno * giorni;
                totalePrelievoAnno += prelievoGiorno * giorni;
            }
            
            const kwhAutoconsumatiFinali = totaleAutoIstantaneo + totaleAutoBatteria;
            const kwhImmessi = totaleImmissioneAnno;
            const autoconsumoPercCalcolato = (produzioneAnnuaNetta > 0) ? (kwhAutoconsumatiFinali / produzioneAnnuaNetta) : 0;
            
            const potenzaPerCalcoloPNRR = Math.min(inputs.potenzaInstallata, inputs.potenzaInverter);
            const massimale_kwp_dinamico = (potenzaPerCalcoloPNRR <= 20) ? 1500 : 1200;
            const spesaMassimaleAmmissibile = potenzaPerCalcoloPNRR * massimale_kwp_dinamico;
            const costoAmmissibilePotenza = Math.min(inputs.costoTotaleImpianto, spesaMassimaleAmmissibile);
            const importoIncentivoPNRR = costoAmmissibilePotenza * inputs.percPNRR;
            const costoRealeCliente = inputs.costoTotaleImpianto - importoIncentivoPNRR;

            const risparmioAutoconsumo = kwhAutoconsumatiFinali * inputs.costoQuotaEnergia;
            const kwhCondivisi = kwhImmessi * inputs.percEnergiaCondivisa;
            const guadagnoRID = kwhImmessi * inputs.prezzoRID;
            const guadagnoCER = kwhCondivisi * inputs.tariffaCER;
            const guadagnoImmissione = guadagnoRID + guadagnoCER;
            const totaleBeneficiPrimoAnnoLordo = risparmioAutoconsumo + guadagnoImmissione;

            let flussoCumulato = -costoRealeCliente;
            let tempoDiRientro = -1;
            let beneficioPrimoAnnoNetto = 0;
            const anniSimulazione = inputs.anniSimulazione;
            
            const paybackPlan = [];
            const chartLabels = [0];
            const chartData = [flussoCumulato];

            for (let anno = 1; anno <= anniSimulazione; anno++) {
                const fattoreDegrado = Math.pow(1 - inputs.degradoAnnua, anno - 1);
                const fattoreInflazione = Math.pow(1 + inputs.inflazioneAnnua, anno - 1);
                
                const risparmioQuestoAnno = risparmioAutoconsumo * fattoreDegrado * fattoreInflazione;
                const guadagnoQuestoAnno = guadagnoImmissione * fattoreDegrado * fattoreInflazione;
                
                const costoManutenzioneQuestoAnno = inputs.costoManutenzione * fattoreInflazione;
                const costoSostituzioneInverterQuestoAnno = (anno === inputs.annoSostituzioneInverter && anno !== 0) 
                    ? (inputs.costoSostituzioneInverter * fattoreInflazione)
                    : 0;
                const costiOMTotaliQuestoAnno = costoManutenzioneQuestoAnno + costoSostituzioneInverterQuestoAnno;

                const flussoDiCassa = risparmioQuestoAnno + guadagnoQuestoAnno - costiOMTotaliQuestoAnno;
                flussoCumulato += flussoDiCassa;

                if (anno === 1) {
                    beneficioPrimoAnnoNetto = flussoDiCassa;
                }

                if (flussoCumulato >= 0 && tempoDiRientro === -1) {
                    const flussoAnnoPrecedente = flussoCumulato - flussoDiCassa;
                    tempoDiRientro = (anno - 1) + (-flussoAnnoPrecedente / flussoDiCassa);
                }

                paybackPlan.push({
                    anno, risparmioQuestoAnno, guadagnoQuestoAnno,
                    costiOMTotaliQuestoAnno, flussoDiCassa, flussoCumulato
                });
                chartLabels.push(anno);
                chartData.push(flussoCumulato);
            }

            return {
                // Input Chiave
                potenzaInstallata: inputs.potenzaInstallata,
                accumuloInstallato: inputs.accumuloInstallato,
                costoTotaleImpianto: inputs.costoTotaleImpianto,
                potenzaInverter: inputs.potenzaInverter,
                areaGeografica: inputs.areaGeografica, 
                profiloConsumo: inputs.profiloConsumo,
                tipoSistema: inputs.tipoSistema,
                efficienzaBatteria: inputs.efficienzaBatteria,
                // Dati Situazione Attuale
                consumoTotale, costoAttualeAnnuo,
                consumoF1: inputs.consumoF1,
                consumoF2: inputs.consumoF2,
                consumoF3: inputs.consumoF3,
                // Dati Ingegneristici
                produzioneAnnuaNetta,
                notaProduzione: productionData.nota,
                produzioneTeorica: productionData.produzioneTeorica,
                perditaClippingPct: productionData.perditaClippingPct,
                ratioOversize: productionData.ratio,
                rifIdeale: productionData.rifIdeale,
                // Dati Costi e Incentivi
                importoIncentivoPNRR, costoRealeCliente,
                potenzaPerCalcoloPNRR, massimale_kwp_dinamico,
                // Dati Benefici Anno 1
                risparmioAutoconsumo, guadagnoImmissione,
                totaleBeneficiPrimoAnnoLordo,
                // Dati KPI Principali
                tempoDiRientro,
                beneficioPrimoAnnoNetto,
                guadagnoTotaleSimulazione: flussoCumulato,
                anniSimulazione,
                // Dati per Tabella e Grafico
                paybackPlan, chartData: { labels: chartLabels, data: chartData },
                // Dati Dettagliati per PDF / Pannello
                costoQuotaEnergia: inputs.costoQuotaEnergia,
                costiFissiBolletta: inputs.costiFissiBolletta,
                spesaMassimaleAmmissibile, costoAmmissibilePotenza,
                percPNRR: inputs.percPNRR,
                guadagnoRID, guadagnoCER,
                kwhAutoconsumati: kwhAutoconsumatiFinali,
                kwhAutoconsumatiIstantaneamente: totaleAutoIstantaneo,
                kwhSpostatiDaAccumulo: totaleAutoBatteria,
                kwhImmessi, kwhCondivisi, kwhPrelievati: totalePrelievoAnno,
                prezzoRID: inputs.prezzoRID, tariffaCER: inputs.tariffaCER,
                percEnergiaCondivisa: inputs.percEnergiaCondivisa,
                autoconsumoPerc: autoconsumoPercCalcolato,
                inflazioneAnnua: inputs.inflazioneAnnua * 100,
                degradoAnnua: inputs.degradoAnnua * 100,
                costoManutenzione: inputs.costoManutenzione,
                costoSostituzioneInverter: inputs.costoSostituzioneInverter,
                annoSostituzioneInverter: inputs.annoSostituzioneInverter
            };
        }


        // --- 4. LOGICA DI INTERFACCIA (Le "Mani") ---

        function getInputs() {
            return {
                // Cliente
                consumoF1: parseFloat(inConsumoF1.value) || 0,
                consumoF2: parseFloat(inConsumoF2.value) || 0,
                consumoF3: parseFloat(inConsumoF3.value) || 0,
                profiloConsumo: inProfiloConsumo.value,
                // Ingegneria
                areaGeografica: inAreaGeografica.value,
                potenzaInstallata: parseFloat(inPotenzaInstallata.value) || 0,
                potenzaInverter: parseFloat(inPotenzaInverter.value) || 0,
                // Impianto
                costoTotaleImpianto: parseFloat(inCostoImpianto.value) || 0,
                tipoSistema: inTipoSistema.value,
                accumuloInstallato: parseFloat(inAccumuloInstallato.value) || 0,
                efficienzaBatteria: (parseFloat(inEfficienzaBatteria.value) / 100) || 0.85,
                // Finanziari
                costoQuotaEnergia: parseFloat(inCostoEnergIA.value) || 0,
                costiFissiBolletta: parseFloat(inCostiFissi.value) || 0,
                inflazioneAnnua: (parseFloat(inInflazione.value) / 100) || 0,
                degradoAnnua: (parseFloat(inDegrado.value) / 100) || 0.005,
                anniSimulazione: parseInt(inSimulazioneAnni.value) || 20,
                // O&M
                costoManutenzione: parseFloat(inCostoManutenzione.value) || 0,
                costoSostituzioneInverter: parseFloat(inCostoSostituzioneInverter.value) || 0,
                annoSostituzioneInverter: parseInt(inAnnoSostituzioneInverter.value) || 0,
                // Incentivi
                percPNRR: (parseFloat(inPercPNRR.value) / 100) || 0,
                tariffaCER: parseFloat(inTariffaCER.value) || 0,
                percEnergiaCondivisa: (parseFloat(inPercCondivisa.value) / 100) || 0,
                prezzoRID: parseFloat(inPrezzoRID.value) || 0
            };
        }

        function updateUI(results) {
            outSituazioneConsumo.textContent = `${results.consumoTotale.toFixed(0)} kWh`;
            outSituazioneCosto.textContent = `${formatCurrency(results.costoAttualeAnnuo)}`;
            outPanoPotenza.textContent = `${results.potenzaInstallata.toFixed(1)} kWp`;
            outPanoAccumulo.textContent = `${results.accumuloInstallato.toFixed(1)} kWh`;
            outPanoProduzione.textContent = `${results.produzioneAnnuaNetta.toFixed(0)} kWh`;
            outPanoProduzioneNota.textContent = results.notaProduzione;
            outPanoCostoImpianto.textContent = `${formatCurrency(results.costoTotaleImpianto)}`;
            outPanoIncentivoPNRR.textContent = `${formatCurrency(results.importoIncentivoPNRR)}`;
            outPanoCostoReale.textContent = `${formatCurrency(results.costoRealeCliente)}`;
            outPanoRisparmio1.textContent = `${formatCurrency(results.risparmioAutoconsumo)}`;
            outPanoGuadagno1.textContent = `${formatCurrency(results.guadagnoImmissione)}`;
            outPanoTotale1.textContent = `${formatCurrency(results.beneficioPrimoAnnoNetto)}`;
            outMassimaleApplicato.textContent = `${results.massimale_kwp_dinamico.toLocaleString('it-IT')} €/kW (su ${results.potenzaPerCalcoloPNRR.toFixed(1)} kW)`;
            kpiPayback.textContent = results.tempoDiRientro > 0 ? `${results.tempoDiRientro.toFixed(1)}` : `> ${results.anniSimulazione}`;
            kpiBenefit.textContent = `${results.beneficioPrimoAnnoNetto.toFixed(0)}`;
            kpiTotalGain.textContent = `${results.guadagnoTotaleSimulazione.toFixed(0)}`;
            outTotalGainLabel.textContent = `Guadagno a ${results.anniSimulazione} Anni`;
            outTableTitle.textContent = `Flusso di Cassa (${results.anniSimulazione} Anni)`;
            outPaybackTableTitle.textContent = `Piano di Rientro (${results.anniSimulazione} Anni)`;
            updatePaybackTable(results.paybackPlan);
            updatePaybackChart(results.chartData);
        }

        function updatePaybackTable(plan) {
            tableBody.innerHTML = '';
            plan.forEach(row => {
                const rowHTML = `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${row.anno}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${formatCurrency(row.risparmioQuestoAnno)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${formatCurrency(row.guadagnoQuestoAnno)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">(${formatCurrency(row.costiOMTotaliQuestoAnno)})</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold ${row.flussoDiCassa >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(row.flussoDiCassa)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold ${row.flussoCumulato < 0 ? 'text-red-600' : 'text-indigo-600'}">${formatCurrency(row.flussoCumulato)}</td>
                    </tr>
                `;
                tableBody.innerHTML += rowHTML;
            });
        }

        function updatePaybackChart(chartData) {
            if (paybackChart) {
                paybackChart.destroy();
            }
            paybackChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: 'Flusso di Cassa Cumulato (€)',
                        data: chartData.data,
                        borderColor: 'rgb(79, 70, 229)',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        fill: true,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { y: { beginAtZero: false, ticks: { callback: value => formatCurrency(value) } } },
                    plugins: { tooltip: { callbacks: { label: context => `Anno ${context.label}: ${formatCurrency(context.raw)}` } } }
                }
            });
        }

        // --- 5. FUNZIONI HELPER E UTILITY ---

        function formatCurrency(value) {
            if (typeof value !== 'number' || isNaN(value)) value = 0;
            return value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }).replace(/\s/g, '');
        }

        function validateInputs() {
            let isValid = true;
            allNumberInputs.forEach(input => {
                input.classList.remove('input-invalid', 'input-valid');
                // Campi che possono essere 0
                const canBeZero = ['consumo-f1', 'consumo-f2', 'consumo-f3', 'costi-fissi-bolletta', 
                                   'inflazione-annua', 'degrado-annuo', 'accumulo-installato', 
                                   'costo-manutenzione-annua', 'costo-sostituzione-inverter', 
                                   'anno-sostituzione-inverter', 'perc-pnrr', 'tariffa-cer', 
                                   'perc-energia-condivisa-cer', 'prezzo-rid', 'costo-totale-impianto'];
                
                if (isNaN(parseFloat(input.value))) {
                    input.classList.add('input-invalid'); isValid = false;
                    return;
                }

                const value = parseFloat(input.value);
                
                if (canBeZero.includes(input.id) && value < 0) {
                    input.classList.add('input-invalid'); isValid = false; // Questi non possono essere negativi
                } else if (!canBeZero.includes(input.id) && value <= 0) {
                    input.classList.add('input-invalid'); isValid = false; // Questi devono essere > 0
                } else if (input.min !== "" && value < parseFloat(input.min)) {
                    input.classList.add('input-invalid'); isValid = false;
                } else if (input.max !== "" && value > parseFloat(input.max)) {
                    input.classList.add('input-invalid'); isValid = false;
                } else {
                    input.classList.add('input-valid');
                }
            });
            allTextInputs.forEach(input => { input.classList.remove('input-invalid'); });
            return isValid;
        }

        function updateRecommendations() {
            try {
                const inputs = getInputs();
                const consumoTotale = inputs.consumoF1 + inputs.consumoF2 + inputs.consumoF3;
                outConsumoAnnuoTotale.textContent = `${consumoTotale.toFixed(0)} kWh`;
                
                if (consumoTotale <= 0) {
                    outPotenzaConsigliata.textContent = "- kWp";
                    outProduzioneConsigliata.textContent = "- kWh";
                    outConsiglioAccumulo.textContent = "- kWh";
                    outConsiglioAccumuloRagione.textContent = "Inserire i consumi per una stima.";
                    return;
                }

                const rifIdeale = RIF_PRODUZIONE_IDEALE[inputs.areaGeografica];
                const potenzaConsigliata = (consumoTotale / rifIdeale); 
                const prodDataConsigliata = calculateNetProduction({
                    ...inputs,
                    potenzaInstallata: potenzaConsigliata,
                    potenzaInverter: potenzaConsigliata,
                    tipoSistema: 'standard-ac',
                    accumuloInstallato: 0
                });
                
                outPotenzaConsigliata.textContent = `~${potenzaConsigliata.toFixed(1)} kWp`;
                outProduzioneConsigliata.textContent = `~${prodDataConsigliata.produzioneAnnuaNetta.toFixed(0)} kWh`;

                const profiloProd = PROFILI_TERNA[inputs.areaGeografica];
                const profiloCons = PROFILI_CONSUMO[inputs.profiloConsumo];
                
                let maxFabbisognoGiornaliero = 0;
                let maxEccessoGiornaliero = 0;

                for (let mese = 0; mese < 12; mese++) {
                    const giorni = GIORNI_MESE[mese];
                    const prodGiorno = (prodDataConsigliata.produzioneAnnuaNetta * profiloProd[mese]) / giorni;
                    const consF1Giorno = (inputs.consumoF1 * profiloCons[mese]) / giorni;
                    const consF2F3Giorno = ((inputs.consumoF2 + inputs.consumoF3) * profiloCons[mese]) / giorni;

                    const autoIstantaneo = Math.min(prodGiorno, consF1Giorno);
                    const eccessoPerBatteria = prodGiorno - autoIstantaneo;
                    
                    if (consF2F3Giorno > maxFabbisognoGiornaliero) {
                        maxFabbisognoGiornaliero = consF2F3Giorno;
                    }
                    if (eccessoPerBatteria > maxEccessoGiornaliero) {
                        maxEccessoGiornaliero = eccessoPerBatteria;
                    }
                }
                
                const fabbisognoDaCaricare = maxFabbisognoGiornaliero / inputs.efficienzaBatteria;
                const accumuloConsigliato = Math.min(maxEccessoGiornaliero, fabbisognoDaCaricare);

                if (accumuloConsigliato > 1.0) {
                    outConsiglioAccumulo.textContent = `~ ${accumuloConsigliato.toFixed(1)} kWh`;
                    outConsiglioAccumuloRagione.textContent = `Stima fabbisogno di picco per coprire i consumi notturni (${maxFabbisognoGiornaliero.toFixed(1)} kWh/notte). Valutare taglia commerciale.`;
                } else {
                    outConsiglioAccumulo.textContent = `No (valutare)`;
                    outConsiglioAccumuloRagione.textContent = `L'eccesso di produzione o i consumi notturni non giustificano un accumulo.`;
                }

            } catch (error) {
                console.error("Errore in updateRecommendations:", error);
            }
        }
        
        function populateCalculationDetails() {
            try {
                const r = pdfResults;
                if (!calcoliEseguiti || Object.keys(r).length === 0) {
                    return "<p class='text-red-500'>Dati non ancora calcolati. Premi 'Calcola' prima.</p>";
                }
                
                const rifIdealeUsato = RIF_PRODUZIONE_IDEALE[r.areaGeografica];
                const gradoIndipendenza = (r.consumoTotale > 0) ? ((r.kwhAutoconsumati / r.consumoTotale) * 100) : 0;

                const html = `
                    <h4>0. Situazione Attuale</h4>
                    <small>Costi stimati senza impianto, basati sui consumi inseriti.</small>
                    <ul>
                        <li><span>Consumo Annuo Totale: ${r.consumoTotale.toFixed(0)} kWh</span><small>${r.consumoF1.toFixed(0)} (F1) + ${r.consumoF2.toFixed(0)} (F2) + ${r.consumoF3.toFixed(0)} (F3)</small></li>
                        <li><span>Costo Quota Energia: ${r.costoQuotaEnergia.toFixed(3)} €/kWh</span></li>
                        <li><span>Costi Fissi Bolletta: ${r.costiFissiBolletta.toFixed(2)} €</span></li>
                        <li><span>Costo Totale Attuale Stimato: <strong>${r.costoAttualeAnnuo.toFixed(2)} €</strong></span><small>Formula: (Consumo Totale * Costo Energia) + Costi Fissi</small></li>
                    </ul>

                    <h4>1. Stima Produzione Ingegneristica (Anno 1)</h4>
                    <small>Calcolo della produzione annua netta basato su dati Terna e stime di clipping.</small>
                    <ul>
                        <li><span>Rapporto Oversize (DC/AC): <strong>${r.ratioOversize.toFixed(2)}</strong></span><small>Formula: ${r.potenzaInstallata} kWp PV / ${r.potenzaInverter} kW Inv</small></li>
                        <li><span>Produzione Teorica (pre-clipping): <strong>${r.produzioneTeorica.toFixed(0)} kWh</strong></span><small>Formula: ${r.potenzaInstallata} kWp * ${rifIdealeUsato} kWh/kWp (Rif. ${r.areaGeografica})</small></li>
                        <li><span>Perdita Clipping Stimata: <strong>${(r.perditaClippingPct * 100).toFixed(2)}%</strong></span><small>Derivata da Matrice[${r.areaGeografica}][${r.ratioOversize.toFixed(1)}] e tipo sistema. ${r.notaProduzione}</small></li>
                        <li><span>Produzione Annua Netta: <strong>${r.produzioneAnnuaNetta.toFixed(0)} kWh</strong></span><small>Formula: Produzione Teorica * (1 - Perdita Clipping)</small></li>
                    </ul>

                    <h4>2. Flussi Energetici Realistici (Simulazione Mensile)</h4>
                    <small>Aggregato annuale della simulazione "Physics First" (mese per mese).</small>
                    <ul>
                        <li><span>Autoconsumo Istantaneo (su F1): <strong>${r.kwhAutoconsumatiIstantaneamente.toFixed(0)} kWh</strong></span><small>Energia prodotta e consumata istantaneamente di giorno (F1).</small></li>
                        <li><span>Autoconsumo da Accumulo (su F2/F3): <strong>${r.kwhSpostatiDaAccumulo.toFixed(0)} kWh</strong></span><small>Energia caricata in batteria (con efficienza ${r.efficienzaBatteria*100}%) e usata di notte (F2/F3).</small></li>
                        <li><span>Totale Autoconsumato (Risparmio): <strong>${r.kwhAutoconsumati.toFixed(0)} kWh</strong></span><small>Formula: Auto Istantaneo + Auto Accumulo</small></li>
                        <li><span>Totale Immesso in Rete (Guadagno): <strong>${r.kwhImmessi.toFixed(0)} kWh</strong></span><small>Energia prodotta, non autoconsumata e non accumulata (perché batteria piena o assente).</small></li>
                        <li><span>Totale Prelievo da Rete (Costo): <strong>${r.kwhPrelievati.toFixed(0)} kWh</strong></span><small>Consumo residuo che l'impianto non è riuscito a coprire.</small></li>
                        <li><span>Percentuale Autoconsumo Reale: <strong>${(r.autoconsumoPerc * 100).toFixed(1)}%</strong></span><small>Formula: (Totale Autoconsumato / Produzione Netta) * 100</small></li>
                        <li><span>Grado Indipendenza Energetica: <strong>${gradoIndipendenza.toFixed(1)}%</strong></span><small>Formula: (Totale Autoconsumato / Consumo Totale) * 100</small></li>
                    </ul>

                    <h4>3. Calcolo Incentivo PNRR</h4>
                    <small>Calcolo del contributo a fondo perduto.</small>
                    <ul>
                        <li><span>Potenza Ammissibile (min(PV, Inv)): <strong>${r.potenzaPerCalcoloPNRR.toFixed(1)} kW</strong></span></li>
                        <li><span>Massimale Applicabile: <strong>${r.massimale_kwp_dinamico.toLocaleString('it-IT')} €/kW</strong></span></li>
                        <li><span>Spesa Massima Ammissibile: <strong>${r.spesaMassimaleAmmissibile.toFixed(2)} €</strong></span><small>Formula: ${r.potenzaPerCalcoloPNRR.toFixed(1)} * ${r.massimale_kwp_dinamico}</small></li>
                        <li><span>Costo Ammissibile (min(Costo, Max)): <strong>${r.costoAmmissibilePotenza.toFixed(2)} €</strong></span></li>
                        <li><span>Importo Incentivo (${(r.percPNRR * 100)}%): <strong>${r.importoIncentivoPNRR.toFixed(2)} €</strong></span><small>Formula: Costo Ammissibile * ${r.percPNRR}</small></li>
                        <li><span>Costo Reale Cliente: <strong>${r.costoRealeCliente.toFixed(2)} €</strong></span><small>Formula: Costo Totale Impianto - Importo Incentivo</small></li>
                    </ul>

                    <h4>4. Benefici Economici (Anno 1)</h4>
                    <small>Scomposizione dei benefici netti del primo anno.</small>
                    <ul>
                        <li><span>Risparmio da Autoconsumo: <strong>${r.risparmioAutoconsumo.toFixed(2)} €</strong></span><small>Formula: ${r.kwhAutoconsumati.toFixed(0)} kWh * ${r.costoQuotaEnergia}</small></li>
                        <li><span>Guadagno Immissione (Lordo): <strong>${r.guadagnoImmissione.toFixed(2)} €</strong></span><small>Formula: (kWh Immessi * Prezzo RID) + (kWh Immessi * % CER * Tariffa CER)</small></li>
                        <li><span>Totale Benefici Lordi (Anno 1): <strong>${r.totaleBeneficiPrimoAnnoLordo.toFixed(2)} €</strong></span><small>Formula: Risparmio + Guadagno Immissione</small></li>
                        <li><span>Costo O&M (Anno 1): <strong>-${r.costoManutenzione.toFixed(2)} €</strong></span></li>
                        <li><span>Beneficio Netto 1° Anno: <strong>${r.beneficioPrimoAnnoNetto.toFixed(2)} €</strong></span><small>Formula: Benefici Lordi - Costo O&M</small></li>
                    </ul>
                `;
                return html;
            } catch (error) {
                console.error("Errore in populateCalculationDetails:", error);
                return "<p class='text-red-500'>Errore durante la generazione dei dettagli: " + error.message + ". Controlla la console per dettagli completi.</p>";
            }
        }

        
        // --- 6. LOGICA DI ESPORTAZIONE PDF (Ristrutturata) ---
        
        // Costanti e Helper di Disegno PDF (resi globali)
        const PDF_MARGIN = 20;
        const PDF_H1_SIZE = 18;
        const PDF_H2_SIZE = 14;
        const PDF_H3_SIZE = 11;
        const PDF_BODY_SIZE = 10;
        const PDF_SMALL_SIZE = 8;
        const PDF_LINE_SPACING = 6;
        const PDF_SECTION_SPACING = 10;
        
        const PDF_COLOR_INDIGO = '#4f46e5';
        const PDF_COLOR_GREEN = '#059669';
        const PDF_COLOR_RED = '#DC2626';
        const PDF_COLOR_TEXT_DARK = '#1f2937';
        const PDF_COLOR_TEXT_GRAY = '#4b5563';
        const PDF_COLOR_BG_LIGHT = '#ffffff';
        const PDF_COLOR_BORDER_LIGHT = '#e5e7eb';
        const PDF_COLOR_BG_SUMMARY_GREEN = '#f0fdf4';
        const PDF_COLOR_BORDER_SUMMARY_GREEN = '#16a34a';
        const PDF_COLOR_BG_SUMMARY_BLUE = '#eff6ff';
        const PDF_COLOR_BORDER_SUMMARY_BLUE = PDF_COLOR_INDIGO;
        const PDF_COLOR_BG_SUMMARY_RED = '#fef2f2';
        const PDF_COLOR_BORDER_SUMMARY_RED = '#DC2626';

        function checkPdfPageBreak(pdf, cursorY, heightNeeded) {
            if (cursorY + heightNeeded > (pdf.internal.pageSize.getHeight() - PDF_MARGIN)) {
                pdf.addPage();
                return PDF_MARGIN;
            }
            return cursorY;
        }

        function drawPdfExplanationBox(pdf, cursorY, rawText) {
            const usableWidth = pdf.internal.pageSize.getWidth() - (PDF_MARGIN * 2);
            const textPadding = 4, textMargin = PDF_MARGIN + textPadding + 3, textWidth = usableWidth - (textPadding * 2) - 6; 
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(PDF_SMALL_SIZE); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
            const textLines = pdf.splitTextToSize(rawText, textWidth);
            const textHeight = textLines.length * 3.5; 
            const boxHeight = textHeight + (textPadding * 2);
            cursorY = checkPdfPageBreak(pdf, cursorY, boxHeight + PDF_SECTION_SPACING);
            pdf.setFillColor('#f9fafb'); pdf.setDrawColor(PDF_COLOR_BORDER_LIGHT); pdf.setLineWidth(0.5);
            pdf.roundedRect(PDF_MARGIN, cursorY, usableWidth, boxHeight, 3, 3, 'FD');
            pdf.setFillColor(PDF_COLOR_INDIGO);
            pdf.roundedRect(PDF_MARGIN, cursorY, 1.5, boxHeight, 3, 3, 'F');
            let textY = cursorY + textPadding + 3;
            for (const line of textLines) { pdf.text(line, textMargin, textY); textY += 4; }
            cursorY += boxHeight + PDF_SECTION_SPACING;
            return cursorY;
        }

        /**
         * Funzione Principale per Esportare il Riepilogo Cliente (ex exportToPdf)
         */
        async function exportSummaryPdf(includeDetails = false) {
            if (!calcoliEseguiti) {
                alert("Devi prima cliccare su 'Calcola Rientro Finanziario'.");
                return;
            }
            const btn = exportSummaryPdfBtn;
            const originalText = btn.innerHTML;
            btn.textContent = 'Creazione PDF in corso...';
            btn.disabled = true;

            try {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                pdf.setFont('helvetica', 'normal');

                const r = pdfResults;
                if (!r || Object.keys(r).length === 0) throw new Error("Dati dei risultati non disponibili.");

                const clientName = inClientName.value || 'Cliente';
                const clientAddress = inClientAddress.value || '';
                
                let cursorY = PDF_MARGIN;
                const usableWidth = pdf.internal.pageSize.getWidth() - (PDF_MARGIN * 2);
                const cardSpacing = 8, cardHeight = 25, cardRadius = 3, cardPadding = 5;
                const cardWidth = (usableWidth - cardSpacing) / 2;

                // ---- INIZIO PDF ----
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(PDF_H1_SIZE); pdf.setTextColor(PDF_COLOR_INDIGO);
                pdf.text('SolarisFlow - Riepilogo Analisi', PDF_MARGIN, cursorY); cursorY += PDF_LINE_SPACING + 2;
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(PDF_H2_SIZE - 2); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
                pdf.text(`Cliente: ${clientName}`, PDF_MARGIN, cursorY); cursorY += PDF_LINE_SPACING;
                if (clientAddress) {
                    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(PDF_BODY_SIZE); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                    pdf.text(`Indirizzo: ${clientAddress}`, PDF_MARGIN, cursorY); cursorY += PDF_LINE_SPACING + 2;
                }
                pdf.setFont('helvetica', 'normal'); pdf.setFontSize(PDF_BODY_SIZE); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                let introText = `Simulazione a ${r.anniSimulazione} anni basata su: Inflazione ${r.inflazioneAnnua.toFixed(1)}%, Degrado ${r.degradoAnnua.toFixed(1)}%. Costi di manutenzione inclusi.`;
                let splitIntro = pdf.splitTextToSize(introText, usableWidth);
                pdf.text(splitIntro, PDF_MARGIN, cursorY); cursorY += (splitIntro.length * (PDF_LINE_SPACING * 0.7)) + PDF_SECTION_SPACING;

                // --- SEZIONE 1: SITUAZIONE ATTUALE ---
                cursorY = checkPdfPageBreak(pdf, cursorY, cardHeight + PDF_SECTION_SPACING);
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(PDF_H2_SIZE); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
                pdf.text('Situazione Attuale (Senza Impianto)', PDF_MARGIN, cursorY); cursorY += PDF_LINE_SPACING + 2;
                pdf.setFillColor(PDF_COLOR_BG_LIGHT); pdf.setDrawColor(PDF_COLOR_BORDER_LIGHT);
                pdf.roundedRect(PDF_MARGIN, cursorY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
                pdf.setFontSize(PDF_SMALL_SIZE); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                pdf.text('CONSUMO ANNUO TOTALE', PDF_MARGIN + cardPadding, cursorY + 8);
                pdf.setFontSize(PDF_H2_SIZE); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
                pdf.text(`${r.consumoTotale.toFixed(0)} kWh`, PDF_MARGIN + cardPadding, cursorY + 18);
                pdf.setFillColor(PDF_COLOR_BG_SUMMARY_RED); pdf.setDrawColor(PDF_COLOR_BORDER_SUMMARY_RED);
                pdf.roundedRect(PDF_MARGIN + cardWidth + cardSpacing, cursorY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
                pdf.setFontSize(PDF_SMALL_SIZE); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                pdf.text('COSTO BOLLETTA ANNUO STIMATO', PDF_MARGIN + cardWidth + cardSpacing + cardPadding, cursorY + 8);
                pdf.setFontSize(PDF_H2_SIZE); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(PDF_COLOR_RED);
                pdf.text(formatCurrency(r.costoAttualeAnnuo), PDF_MARGIN + cardWidth + cardSpacing + cardPadding, cursorY + 18);
                cursorY += cardHeight + PDF_SECTION_SPACING;
                cursorY = drawPdfExplanationBox(pdf, cursorY, `Costo Attuale: Costo stimato annuo, calcolato sommando i consumi per la quota energia (${formatCurrency(r.costoQuotaEnergia)}/kWh) e i costi fissi (${formatCurrency(r.costiFissiBolletta)}).`);
                
// --- SEZIONE 2: NUOVO IMPIANTO (Fix 2x3) ---
                cursorY = checkPdfPageBreak(pdf, cursorY, cardHeight * 2 + cardSpacing + PDF_SECTION_SPACING);
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(PDF_H2_SIZE); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
                pdf.text('Il Tuo Nuovo Impianto Fotovoltaico', PDF_MARGIN, cursorY); cursorY += PDF_LINE_SPACING + 2;
                
                // *** QUESTA È LA CORREZIONE: Variabile di larghezza locale ***
                const cardWidth_Sec2 = (usableWidth - (cardSpacing * 2)) / 3; // 3 card per riga
                
                let cardY = cursorY;
                let cardX = PDF_MARGIN;

                // --- Riga 1 ---
                // Card 1: Potenza PV
                pdf.setFillColor(PDF_COLOR_BG_LIGHT); pdf.setDrawColor(PDF_COLOR_BORDER_LIGHT);
                pdf.roundedRect(cardX, cardY, cardWidth_Sec2, cardHeight, cardRadius, cardRadius, 'FD');
                pdf.setFontSize(PDF_SMALL_SIZE); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                pdf.text('POTENZA PANNELLI (PV)', cardX + cardPadding, cardY + 8);
                pdf.setFontSize(PDF_H2_SIZE); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
                pdf.text(`${r.potenzaInstallata.toFixed(1)} kWp`, cardX + cardPadding, cardY + 18);
                
                // Card 2: Potenza Inverter
                cardX += cardWidth_Sec2 + cardSpacing;
                pdf.setFillColor(PDF_COLOR_BG_LIGHT); pdf.setDrawColor(PDF_COLOR_BORDER_LIGHT);
                pdf.roundedRect(cardX, cardY, cardWidth_Sec2, cardHeight, cardRadius, cardRadius, 'FD');
                pdf.setFontSize(PDF_SMALL_SIZE); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                pdf.text('POTENZA INVERTER', cardX + cardPadding, cardY + 8);
                pdf.setFontSize(PDF_H2_SIZE); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
                pdf.text(`${r.potenzaInverter.toFixed(1)} kW`, cardX + cardPadding, cardY + 18);

                // Card 3: Accumulo (NUOVO)
                cardX += cardWidth_Sec2 + cardSpacing;
                pdf.setFillColor(PDF_COLOR_BG_LIGHT); pdf.setDrawColor(PDF_COLOR_BORDER_LIGHT);
                pdf.roundedRect(cardX, cardY, cardWidth_Sec2, cardHeight, cardRadius, cardRadius, 'FD');
                pdf.setFontSize(PDF_SMALL_SIZE); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                pdf.text('ACCUMULO INSTALLATO', cardX + cardPadding, cardY + 8);
                pdf.setFontSize(PDF_H2_SIZE); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
                pdf.text(`${r.accumuloInstallato.toFixed(1)} kWh`, cardX + cardPadding, cardY + 18);

                // --- Riga 2 ---
                cardY += cardHeight + cardSpacing;
                cardX = PDF_MARGIN; // Reset X
                
                // Card 4: Produzione
                pdf.setFillColor(PDF_COLOR_BG_LIGHT); pdf.setDrawColor(PDF_COLOR_BORDER_LIGHT);
                pdf.roundedRect(cardX, cardY, cardWidth_Sec2, cardHeight, cardRadius, cardRadius, 'FD');
                pdf.setFontSize(PDF_SMALL_SIZE); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                pdf.text('PRODUZIONE ANNUA NETTA', cardX + cardPadding, cardY + 8);
                pdf.setFontSize(PDF_H2_SIZE); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
                pdf.text(`${r.produzioneAnnuaNetta.toFixed(0)} kWh`, cardX + cardPadding, cardY + 18);

                // Card 5: Autoconsumo
                cardX += cardWidth_Sec2 + cardSpacing;
                pdf.setFillColor(PDF_COLOR_BG_LIGHT); pdf.setDrawColor(PDF_COLOR_BORDER_LIGHT);
                pdf.roundedRect(cardX, cardY, cardWidth_Sec2, cardHeight, cardRadius, cardRadius, 'FD');
                pdf.setFontSize(PDF_SMALL_SIZE); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                pdf.text('% AUTOCONSUMO REALE', cardX + cardPadding, cardY + 8);
                pdf.setFontSize(PDF_H2_SIZE); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
                pdf.text(`${(r.autoconsumoPerc * 100).toFixed(0)}%`, cardX + cardPadding, cardY + 18);

                // Card 6: Indipendenza (NUOVO)
                cardX += cardWidth_Sec2 + cardSpacing;
                // Calcoliamo qui il Grado Indipendenza
                const gradoIndipendenza = (r.consumoTotale > 0) ? ((r.kwhAutoconsumati / r.consumoTotale) * 100) : 0;
                pdf.setFillColor(PDF_COLOR_BG_LIGHT); pdf.setDrawColor(PDF_COLOR_BORDER_LIGHT);
                pdf.roundedRect(cardX, cardY, cardWidth_Sec2, cardHeight, cardRadius, cardRadius, 'FD');
                pdf.setFontSize(PDF_SMALL_SIZE); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                pdf.text('GRADO INDIPENDENZA', cardX + cardPadding, cardY + 8);
                pdf.setFontSize(PDF_H2_SIZE); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
                pdf.text(`${gradoIndipendenza.toFixed(0)}%`, cardX + cardPadding, cardY + 18);
                
                // Fine sezione
                cursorY = cardY + cardHeight + PDF_SECTION_SPACING;
                cursorY = drawPdfExplanationBox(pdf, cursorY, `Produzione: Stima Terna con perdite clipping (${(r.perditaClippingPct * 100).toFixed(1)}%). Autoconsumo: % di energia *prodotta* che usi. Indipendenza: % del tuo *fabbisogno* coperto dall'impianto.`);

                // --- SEZIONE 3: COSTI E INCENTIVI ---
                cursorY = checkPdfPageBreak(pdf, cursorY, cardHeight * 2 + cardSpacing + PDF_SECTION_SPACING);
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(PDF_H2_SIZE); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
                pdf.text('Analisi Costi e Incentivi', PDF_MARGIN, cursorY); cursorY += PDF_LINE_SPACING + 2;
                cardY = cursorY;
                pdf.setFillColor(PDF_COLOR_BG_LIGHT); pdf.setDrawColor(PDF_COLOR_BORDER_LIGHT);
                pdf.roundedRect(PDF_MARGIN, cardY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
                pdf.setFontSize(PDF_SMALL_SIZE); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                pdf.text('COSTO TOTALE IMPIANTO', PDF_MARGIN + cardPadding, cardY + 8);
                pdf.setFontSize(PDF_H2_SIZE); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
                pdf.text(formatCurrency(r.costoTotaleImpianto), PDF_MARGIN + cardPadding, cardY + 18);
                pdf.setFillColor(PDF_COLOR_BG_LIGHT); pdf.setDrawColor(PDF_COLOR_BORDER_LIGHT);
                pdf.roundedRect(PDF_MARGIN + cardWidth + cardSpacing, cardY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
                pdf.setFontSize(PDF_SMALL_SIZE); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                pdf.text('INCENTIVO PNRR (Fondo Perduto)', PDF_MARGIN + cardWidth + cardSpacing + cardPadding, cardY + 8);
                pdf.setFontSize(PDF_H2_SIZE); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(PDF_COLOR_GREEN);
                pdf.text(formatCurrency(r.importoIncentivoPNRR), PDF_MARGIN + cardWidth + cardSpacing + cardPadding, cardY + 18);
                cardY += cardHeight + cardSpacing;
                pdf.setFillColor(PDF_COLOR_BG_SUMMARY_BLUE); pdf.setDrawColor(PDF_COLOR_BORDER_SUMMARY_BLUE);
                pdf.roundedRect(PDF_MARGIN, cardY, usableWidth, cardHeight, cardRadius, cardRadius, 'FD');
                pdf.setFontSize(PDF_SMALL_SIZE); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                pdf.text('COSTO REALE PER IL CLIENTE', PDF_MARGIN + cardPadding, cardY + 8);
                pdf.setFontSize(PDF_H2_SIZE); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(PDF_COLOR_INDIGO);
                pdf.text(formatCurrency(r.costoRealeCliente), PDF_MARGIN + cardPadding, cardY + 18);
                cursorY = cardY + cardHeight + PDF_SECTION_SPACING;
                cursorY = drawPdfExplanationBox(pdf, cursorY, `Incentivo PNRR: Calcolato al ${r.percPNRR * 100}% sul valore minore tra il costo impianto (${formatCurrency(r.costoTotaleImpianto)}) e la spesa massima ammissibile (${formatCurrency(r.spesaMassimaleAmmissibile)}), basata su una potenza di ${r.potenzaPerCalcoloPNRR.toFixed(1)} kW.`);

                // --- SEZIONE 4: BENEFICI 1° ANNO ---
                cursorY = checkPdfPageBreak(pdf, cursorY, cardHeight * 2 + cardSpacing + PDF_SECTION_SPACING);
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(PDF_H2_SIZE); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
                pdf.text('Riepilogo Benefici (Primo Anno)', PDF_MARGIN, cursorY); cursorY += PDF_LINE_SPACING + 2;
                cardY = cursorY;
                pdf.setFillColor(PDF_COLOR_BG_LIGHT); pdf.setDrawColor(PDF_COLOR_BORDER_LIGHT);
                pdf.roundedRect(PDF_MARGIN, cardY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
                pdf.setFontSize(PDF_SMALL_SIZE); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                pdf.text('RISPARMIO (AUTOCONSUMO)', PDF_MARGIN + cardPadding, cardY + 8);
                pdf.setFontSize(PDF_H2_SIZE); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(PDF_COLOR_GREEN);
                pdf.text(formatCurrency(r.risparmioAutoconsumo), PDF_MARGIN + cardPadding, cardY + 18);
                pdf.setFillColor(PDF_COLOR_BG_LIGHT); pdf.setDrawColor(PDF_COLOR_BORDER_LIGHT);
                pdf.roundedRect(PDF_MARGIN + cardWidth + cardSpacing, cardY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
                pdf.setFontSize(PDF_SMALL_SIZE); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                pdf.text('GUADAGNO (RID + PREMIO CER)', PDF_MARGIN + cardWidth + cardSpacing + cardPadding, cardY + 8);
                pdf.setFontSize(PDF_H2_SIZE); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(PDF_COLOR_GREEN);
                pdf.text(formatCurrency(r.guadagnoImmissione), PDF_MARGIN + cardWidth + cardSpacing + cardPadding, cardY + 18);
                cardY += cardHeight + cardSpacing;
                pdf.setFillColor(PDF_COLOR_BG_SUMMARY_GREEN); pdf.setDrawColor(PDF_COLOR_BORDER_SUMMARY_GREEN);
                pdf.roundedRect(PDF_MARGIN, cardY, usableWidth, cardHeight, cardRadius, cardRadius, 'FD');
                pdf.setFontSize(PDF_SMALL_SIZE); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                pdf.text('TOTALE BENEFICI NETTI 1° ANNO (dopo O&M)', PDF_MARGIN + cardPadding, cardY + 8);
                pdf.setFontSize(PDF_H2_SIZE); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(PDF_COLOR_GREEN);
                pdf.text(formatCurrency(r.beneficioPrimoAnnoNetto), PDF_MARGIN + cardPadding, cardY + 18);
                cursorY = cardY + cardHeight + PDF_SECTION_SPACING;
                cursorY = drawPdfExplanationBox(pdf, cursorY, `Benefici: Risparmio da energia autoconsumata (${r.kwhAutoconsumati.toFixed(0)} kWh). Guadagno da energia immessa (${r.kwhImmessi.toFixed(0)} kWh). Costi O&M (${formatCurrency(r.costoManutenzione)}) già sottratti.`);

                // --- SEZIONE 5: TEMPO DI RIENTRO ---
                cursorY = checkPdfPageBreak(pdf, cursorY, cardHeight + PDF_SECTION_SPACING);
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(PDF_H2_SIZE); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
                pdf.text('Tempo di Rientro dell\'Investimento', PDF_MARGIN, cursorY); cursorY += PDF_LINE_SPACING + 2;
                cardY = cursorY;
                pdf.setFillColor(PDF_COLOR_BG_SUMMARY_BLUE); pdf.setDrawColor(PDF_COLOR_BORDER_SUMMARY_BLUE);
                pdf.roundedRect(PDF_MARGIN, cardY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
                pdf.setFontSize(PDF_SMALL_SIZE); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                pdf.text('TEMPO DI RIENTRO STIMATO', PDF_MARGIN + cardPadding, cardY + 8);
                pdf.setFontSize(PDF_H2_SIZE); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(PDF_COLOR_INDIGO);
                pdf.text(r.tempoDiRientro > 0 ? `${r.tempoDiRientro.toFixed(1)} Anni` : `> ${r.anniSimulazione} Anni`, PDF_MARGIN + cardPadding, cardY + 18);
                pdf.setFillColor(PDF_COLOR_BG_SUMMARY_GREEN); pdf.setDrawColor(PDF_COLOR_BORDER_SUMMARY_GREEN);
                pdf.roundedRect(PDF_MARGIN + cardWidth + cardSpacing, cardY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
                pdf.setFontSize(PDF_SMALL_SIZE); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                pdf.text(`GUADAGNO NETTO A ${r.anniSimulazione} ANNI`, PDF_MARGIN + cardWidth + cardSpacing + cardPadding, cardY + 8);
                pdf.setFontSize(PDF_H2_SIZE); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(PDF_COLOR_GREEN);
                pdf.text(formatCurrency(r.guadagnoTotaleSimulazione), PDF_MARGIN + cardWidth + cardSpacing + cardPadding, cardY + 18);
                cursorY = cardY + cardHeight + PDF_SECTION_SPACING;
                cursorY = drawPdfExplanationBox(pdf, cursorY, `Tempo di Rientro: Anni necessari affinché i benefici netti (risparmi + guadagni - O&M) eguaglino il costo reale (${formatCurrency(r.costoRealeCliente)}).`);
                
                // --- SEZIONE 6: GRAFICO ---
                cursorY = checkPdfPageBreak(pdf, cursorY, 80); 
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(PDF_H2_SIZE); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
                pdf.text('Flusso di Cassa Cumulato', PDF_MARGIN, cursorY); cursorY += PDF_LINE_SPACING + 2;
                const chartCanvas = document.getElementById('payback-chart');
                const chartImgData = chartCanvas.toDataURL('image/png', 1.0);
                const chartHeight = (chartCanvas.height * usableWidth) / chartCanvas.width;
                pdf.addImage(chartImgData, 'PNG', PDF_MARGIN, cursorY, usableWidth, chartHeight);
                cursorY += chartHeight + PDF_SECTION_SPACING;

                // --- SEZIONE 7: TABELLA PIANO DI RIENTRO ---
                cursorY = checkPdfPageBreak(pdf, cursorY, 50); 
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(PDF_H2_SIZE); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
                pdf.text(`Piano di Rientro (${r.anniSimulazione} Anni)`, PDF_MARGIN, cursorY); cursorY += PDF_LINE_SPACING + 2;
                const tableX = PDF_MARGIN, tableY = cursorY;
                const colWidths = [18, (usableWidth-18)/5, (usableWidth-18)/5, (usableWidth-18)/5, (usableWidth-18)/5, (usableWidth-18)/5];
                let currentX = tableX;
                pdf.setFillColor(PDF_COLOR_BG_LIGHT); pdf.rect(tableX, tableY, usableWidth, 10, 'F');
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(PDF_SMALL_SIZE); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                pdf.text('ANNO', currentX + 3, tableY + 7); currentX += colWidths[0];
                pdf.text('RISPARMIO', currentX + 5, tableY + 7); currentX += colWidths[1];
                pdf.text('GUADAGNO', currentX + 5, tableY + 7); currentX += colWidths[2];
                pdf.text('COSTI O&M', currentX + 5, tableY + 7); currentX += colWidths[3];
                pdf.text('FLUSSO NETTO', currentX + 5, tableY + 7); currentX += colWidths[4];
                pdf.text('CUMULATO', currentX + 5, tableY + 7);
                cursorY += 10;
                pdf.setFont('helvetica', 'normal'); pdf.setFontSize(PDF_BODY_SIZE - 1); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
                const tableRows = document.getElementById('payback-table-body').rows;
                const rowHeight = 8;
                for (let i = 0; i < tableRows.length; i++) {
                    cursorY = checkPdfPageBreak(pdf, cursorY, rowHeight); 
                    const row = tableRows[i]; const cells = row.cells;
                    currentX = tableX;
                    if (i % 2 === 1) { pdf.setFillColor("#f9fafb"); pdf.rect(tableX, cursorY, usableWidth, rowHeight, 'F'); }
                    pdf.text(cells[0].innerText, currentX + 3, cursorY + 6); currentX += colWidths[0];
                    pdf.text(cells[1].innerText, currentX + 5, cursorY + 6); currentX += colWidths[1];
                    pdf.text(cells[2].innerText, currentX + 5, cursorY + 6); currentX += colWidths[2];
                    pdf.setFont('helvetica', 'normal'); pdf.setTextColor(PDF_COLOR_RED);
                    pdf.text(cells[3].innerText, currentX + 5, cursorY + 6); currentX += colWidths[3];
                    pdf.setFont('helvetica', 'bold');
                    let flussoValue = parseFloat(cells[4].innerText.replace(/[^0-9,-]+/g,"").replace('.','').replace(',', '.'));
                    pdf.setTextColor(flussoValue >= 0 ? PDF_COLOR_GREEN : PDF_COLOR_RED);
                    pdf.text(cells[4].innerText, currentX + 5, cursorY + 6); currentX += colWidths[4];
                    pdf.setFont('helvetica', 'bold');
                    let cumulatoValue = parseFloat(cells[5].innerText.replace(/[^0-9,-]+/g,"").replace('.','').replace(',', '.'));
                    pdf.setTextColor(cumulatoValue < 0 ? PDF_COLOR_RED : PDF_COLOR_INDIGO);
                    pdf.text(cells[5].innerText, currentX + 5, cursorY + 6);
                    pdf.setFont('helvetica', 'normal'); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
                    cursorY += rowHeight;
                }
                
                // --- SEZIONE 8: DETTAGLIO CALCOLI (Condizionale) ---
                if (includeDetails) {
                    pdf.addPage();
                    cursorY = PDF_MARGIN;
                    // *** FIX: Chiamata corretta ***
                    cursorY = drawTechnicalDetails(pdf, cursorY, r);
                }

                pdf.save(`SolarisFlow-Riepilogo-${clientName.replace(/ /g, '_')}.pdf`);

            } catch (err) {
                console.error("Errore during l'esportazione PDF del riepilogo:", err);
                alert("Si è verificato un errore during la generazione del PDF: " + err.message);
            } finally {
                btn.innerHTML = "Esporta Riepilogo Cliente";
                btn.disabled = false;
            }
        }
        
        /**
         * NUOVA Funzione per esportare SOLO i dettagli tecnici
         */
        async function exportDetailsPdf() {
            if (!calcoliEseguiti) {
                alert("Devi prima cliccare su 'Calcola Rientro Finanziario'.");
                return;
            }
            const btn = exportDetailsPdfBtn;
            const originalText = btn.innerHTML;
            btn.textContent = 'Creazione in corso...';
            btn.disabled = true;

            try {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                pdf.setFont('helvetica', 'normal');
                
                const r = pdfResults;
                if (!r || Object.keys(r).length === 0) throw new Error("Dati dei risultati non disponibili.");
                
                let cursorY = PDF_MARGIN;
                
                // *** FIX: Chiamata corretta ***
                cursorY = drawTechnicalDetails(pdf, cursorY, r);
                
                const clientName = inClientName.value || 'Cliente';
                pdf.save(`SolarisFlow-Dettaglio_Tecnico-${clientName.replace(/ /g, '_')}.pdf`);

            } catch (err) {
                console.error("Errore during l'esportazione PDF dei dettagli:", err);
                alert("Si è verificato un errore during la generazione del PDF: " + err.message);
            } finally {
                btn.innerHTML = "Esporta Solo Dettagli Tecnici";
                btn.disabled = false;
            }
        }
        
        /**
         * NUOVA Funzione "Motore" per disegnare i dettagli tecnici (usata da entrambe le export)
         * *** FIX: Tutte le chiamate a 'pdf.autoTable' sono state corrette in 'window.jspdf.autoTable(pdf, ...)' ***
         */
        function drawTechnicalDetails(pdf, cursorY, r) {
            const usableWidth = pdf.internal.pageSize.getWidth() - (PDF_MARGIN * 2);
            
            // Titolo
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(PDF_H1_SIZE); pdf.setTextColor(PDF_COLOR_INDIGO);
            pdf.text('Dettaglio Calcoli Tecnici e Costanti', PDF_MARGIN, cursorY);
            cursorY += PDF_H1_SIZE / 2 + PDF_SECTION_SPACING;

            // --- SEZIONE 1: INPUT UTENTE ---
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(PDF_H2_SIZE); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
            pdf.text('1. Dati di Input Principali', PDF_MARGIN, cursorY); cursorY += PDF_LINE_SPACING * 1.5;
            
            let inputData = [
                ['Cliente:', inClientName.value || 'N/D', 'Area Geografica:', PROFILI_TERNA_NOMI[r.areaGeografica]],
                ['Profilo Consumo:', PROFILI_CONSUMO_NOMI[r.profiloConsumo], 'Tipo Sistema:', r.tipoSistema === 'ibrido-dc' ? 'Ibrido (DC)' : 'Standard (AC)'],
                ['Potenza PV:', `${r.potenzaInstallata.toFixed(1)} kWp`, 'Consumo F1:', `${r.consumoF1.toFixed(0)} kWh`],
                ['Potenza Inverter:', `${r.potenzaInverter.toFixed(1)} kW`, 'Consumo F2:', `${r.consumoF2.toFixed(0)} kWh`],
                ['Capacità Accumulo:', `${r.accumuloInstallato.toFixed(1)} kWh`, 'Consumo F3:', `${r.consumoF3.toFixed(0)} kWh`],
                ['Efficienza Accumulo:', `${(r.efficienzaBatteria*100).toFixed(0)}%`, 'Costo Energia:', `${formatCurrency(r.costoQuotaEnergia)}/kWh`]
            ];
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(PDF_BODY_SIZE);
            
            // *** FIX: Chiamata corretta a autoTable ***
            pdf.autoTable({
                startY: cursorY,
                head: [['Parametro', 'Valore', 'Parametro', 'Valore']],
                body: inputData,
                theme: 'striped',
                headStyles: { fillColor: PDF_COLOR_TEXT_GRAY },
                styles: { fontSize: PDF_SMALL_SIZE }
            });
            cursorY = pdf.autoTable.previous.finalY + PDF_SECTION_SPACING;

            // --- SEZIONE 2: COSTANTI DI CALCOLO ---
            cursorY = checkPdfPageBreak(pdf, cursorY, 30);
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(PDF_H2_SIZE); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
            pdf.text('2. Costanti di Simulazione (Motore di Calcolo)', PDF_MARGIN, cursorY); cursorY += PDF_LINE_SPACING * 1.5;
            
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(PDF_H3_SIZE); pdf.setTextColor(PDF_COLOR_INDIGO);
            pdf.text('Profili Produzione Terna (Rif. %)', PDF_MARGIN, cursorY); cursorY += PDF_LINE_SPACING;
            
            pdf.autoTable({
                startY: cursorY,
                head: [['Mese', 'Nord', 'Centro', 'Sud']],
                body: GIORNI_MESE.map((_, i) => [
                    new Date(2000, i).toLocaleString('it-IT', { month: 'long' }),
                    `${(PROFILI_TERNA.nord[i] * 100).toFixed(1)}%`,
                    `${(PROFILI_TERNA.centro[i] * 100).toFixed(1)}%`,
                    `${(PROFILI_TERNA.sud[i] * 100).toFixed(1)}%`
                ]),
                theme: 'grid', headStyles: { fillColor: PDF_COLOR_TEXT_GRAY }, styles: { fontSize: PDF_SMALL_SIZE }
            });
            cursorY = pdf.autoTable.previous.finalY + PDF_SECTION_SPACING;
            
            cursorY = checkPdfPageBreak(pdf, cursorY, 30);
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(PDF_H3_SIZE); pdf.setTextColor(PDF_COLOR_INDIGO);
            pdf.text('Riferimento Produzione Ideale (kWh/kWp)', PDF_MARGIN, cursorY); cursorY += PDF_LINE_SPACING;
            // *** FIX: Chiamata corretta a autoTable ***
            pdf.autoTable({
                startY: cursorY,
                body: [
                    ['Nord', `${RIF_PRODUZIONE_IDEALE.nord} kWh/kWp`],
                    ['Centro', `${RIF_PRODUZIONE_IDEALE.centro} kWh/kWp`],
                    ['Sud', `${RIF_PRODUZIONE_IDEALE.sud} kWh/kWp`]
                ],
                theme: 'grid', headStyles: { fillColor: PDF_COLOR_TEXT_GRAY }, styles: { fontSize: PDF_SMALL_SIZE }
            });
            cursorY = pdf.autoTable.previous.finalY + PDF_SECTION_SPACING;

            cursorY = checkPdfPageBreak(pdf, cursorY, 30);
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(PDF_H3_SIZE); pdf.setTextColor(PDF_COLOR_INDIGO);
            pdf.text('Matrice Stima Perdite Clipping (non-lineare)', PDF_MARGIN, cursorY); cursorY += PDF_LINE_SPACING;
            const clippingRatios = Object.keys(MATRICE_CLIPPING.nord);
            
            pdf.autoTable({
                startY: cursorY,
                head: [['Rapporto DC/AC', ...clippingRatios]],
                body: [
                    ['Nord', ...clippingRatios.map(k => `${(MATRICE_CLIPPING.nord[k]*100).toFixed(1)}%`)],
                    ['Centro', ...clippingRatios.map(k => `${(MATRICE_CLIPPING.centro[k]*100).toFixed(1)}%`)],
                    ['Sud', ...clippingRatios.map(k => `${(MATRICE_CLIPPING.sud[k]*100).toFixed(1)}%`)]
                ],
                theme: 'grid', headStyles: { fillColor: PDF_COLOR_TEXT_GRAY }, styles: { fontSize: 7 } // Font più piccolo
            });
            cursorY = pdf.autoTable.previous.finalY + PDF_SECTION_SPACING;

            // --- SEZIONE 3: CALCOLI DETTAGLIATI ---
            cursorY = checkPdfPageBreak(pdf, cursorY, 30);
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(PDF_H2_SIZE); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
            pdf.text('3. Risultati Calcolo Dettagliati (Anno 1)', PDF_MARGIN, cursorY); cursorY += PDF_LINE_SPACING * 1.5;

            const detailsHtml = populateCalculationDetails();
            const detailsElement = document.createElement('div');
            detailsElement.innerHTML = detailsHtml;
            
            pdf.setFont('helvetica', 'normal');
            
            // --- INIZIA LA SOSTITUZIONE QUI (riga 1083) ---
            detailsElement.querySelectorAll('h4').forEach(h4 => {
                cursorY = checkPdfPageBreak(pdf, cursorY, 12);
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(PDF_H3_SIZE); pdf.setTextColor(PDF_COLOR_INDIGO);
                pdf.text(h4.innerText, PDF_MARGIN, cursorY); cursorY += PDF_LINE_SPACING; // 1. Disegna H4

                const small = h4.nextElementSibling; // 2. Trova <small>
                let ul = null; // Inizializza ul

                // 3. Disegna <small> se esiste ed è un <small>
                if (small && small.tagName === 'SMALL') {
                    pdf.setFont('helvetica', 'italic'); pdf.setFontSize(PDF_SMALL_SIZE); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                    let smallText = pdf.splitTextToSize(small.innerText, usableWidth - 5); // Indenta
                    pdf.text(smallText, PDF_MARGIN + 5, cursorY);
                    cursorY += (smallText.length * (PDF_LINE_SPACING * 0.7)) + 2; // Aggiungi spaziatura

                    ul = small.nextElementSibling; // 4. Trova il *prossimo* fratello, che ora è <ul>
                } else {
                    ul = small; // Altrimenti, supponi che <small> mancasse e questo sia <ul>
                }

                // 5. Disegna <ul> se esiste ed è un <ul>
                if (ul && ul.tagName === 'UL') {
                    ul.querySelectorAll('li').forEach(li => {
                        const title = li.querySelector('span');
                        const formula = li.querySelector('small');

                        cursorY = checkPdfPageBreak(pdf, cursorY, 10);

                        if (title) {
                            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(PDF_BODY_SIZE); pdf.setTextColor(PDF_COLOR_TEXT_DARK);
                            let titleText = pdf.splitTextToSize(title.innerText, usableWidth);
                            pdf.text(titleText, PDF_MARGIN, cursorY);
                            cursorY += (titleText.length * (PDF_LINE_SPACING * 0.8));
                        }

                        if (formula) {
                            pdf.setFont('helvetica', 'italic'); pdf.setFontSize(PDF_SMALL_SIZE); pdf.setTextColor(PDF_COLOR_TEXT_GRAY);
                            let formulaText = pdf.splitTextToSize(formula.innerText, usableWidth - 5); // Indenta un po'
                            pdf.text(formulaText, PDF_MARGIN + 5, cursorY);
                            cursorY += (formulaText.length * (PDF_LINE_SPACING * 0.7));
                        }
                        cursorY += 2; // Spaziatura tra li
                    });
                }
                cursorY += PDF_LINE_SPACING; // Spaziatura tra sezioni
            });
            // --- FINISCE LA SOSTITUZIONE QUI (riga 1111) ---
            return cursorY; // Ritorna la posizione finale
        }
        

        function saveState() {
            const state = {
                clientName: inClientName.value,
                clientAddress: inClientAddress.value,
                profiloConsumo: inProfiloConsumo.value,
                consumoF1: inConsumoF1.value,
                consumoF2: inConsumoF2.value,
                consumoF3: inConsumoF3.value,
                areaGeografica: inAreaGeografica.value,
                potenzaPvInstallata: inPotenzaInstallata.value,
                potenzaInverterInstallato: inPotenzaInverter.value,
                costoTotaleImpianto: inCostoImpianto.value,
                tipoSistema: inTipoSistema.value,
                accumuloInstallato: inAccumuloInstallato.value,
                efficienzaBatteria: inEfficienzaBatteria.value,
                costoEnergia: inCostoEnergIA.value,
                costiFissiBolletta: inCostiFissi.value,
                inflazioneAnnua: inInflazione.value,
                degradoAnnua: inDegrado.value,
                simulazioneAnni: inSimulazioneAnni.value,
                costoManutenzione: inCostoManutenzione.value,
                costoSostituzioneInverter: inCostoSostituzioneInverter.value,
                annoSostituzioneInverter: inAnnoSostituzioneInverter.value,
                percPnrr: inPercPNRR.value,
                tariffaCer: inTariffaCER.value,
                percEnergiaCondivisaCer: inPercCondivisa.value,
                prezzoRid: inPrezzoRID.value
            };
            localStorage.setItem('solarisFlowState', JSON.stringify(state));
        }

        function loadState() {
            const state = JSON.parse(localStorage.getItem('solarisFlowState'));
            const source = state || defaultValues;
            
            inClientName.value = source.clientName || defaultValues['client-name'];
            inClientAddress.value = source.clientAddress || defaultValues['client-address'];
            inProfiloConsumo.value = source.profiloConsumo || defaultValues['profilo-consumo'];
            inConsumoF1.value = source.consumoF1 || defaultValues['consumo-f1'];
            inConsumoF2.value = source.consumoF2 || defaultValues['consumo-f2'];
            inConsumoF3.value = source.consumoF3 || defaultValues['consumo-f3'];
            inAreaGeografica.value = source.areaGeografica || defaultValues['area-geografica'];
            inPotenzaInstallata.value = source.potenzaPvInstallata || defaultValues['potenza-pv-installata'];
            inPotenzaInverter.value = source.potenzaInverterInstallato || defaultValues['potenza-inverter-installato'];
            inCostoImpianto.value = source.costoTotaleImpianto || defaultValues['costo-totale-impianto'];
            inTipoSistema.value = source.tipoSistema || defaultValues['tipo-sistema'];
            inAccumuloInstallato.value = source.accumuloInstallato || defaultValues['accumulo-installato'];
            inEfficienzaBatteria.value = source.efficienzaBatteria || defaultValues['efficienza-batteria'];
            inCostoEnergIA.value = source.costoEnergia || defaultValues['costo-energia'];
            inCostiFissi.value = source.costiFissiBolletta || defaultValues['costi-fissi-bolletta'];
            inInflazione.value = source.inflazioneAnnua || defaultValues['inflazione-annua'];
            inDegrado.value = source.degradoAnnua || defaultValues['degrado-annuo'];
            inSimulazioneAnni.value = source.simulazioneAnni || defaultValues['simulazione-anni'];
            inCostoManutenzione.value = source.costoManutenzione || defaultValues['costo-manutenzione-annua'];
            inCostoSostituzioneInverter.value = source.costoSostituzioneInverter || defaultValues['costo-sostituzione-inverter'];
            inAnnoSostituzioneInverter.value = source.annoSostituzioneInverter || defaultValues['anno-sostituzione-inverter'];
            inPercPNRR.value = source.percPnrr || defaultValues['perc-pnrr'];
            inTariffaCER.value = source.tariffaCer || defaultValues['tariffa-cer'];
            inPercCondivisa.value = source.percEnergiaCondivisaCer || defaultValues['perc-energia-condivisa-cer'];
            inPrezzoRID.value = source.prezzoRid || defaultValues['prezzo-rid'];
            
            updateRecommendations();
            validateInputs();
        }

        function resetForm() {
            if (confirm("Sei sicuro di voler resettare tutti i campi ai valori di default?")) {
                localStorage.removeItem('solarisFlowState');
                loadState(); 

                calcoliEseguiti = false;
                pdfResults = {};
                tableBody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-gray-500">Inserisci i dati e calcola per vedere i risultati.</td></tr>';
                
                const uiElementsToReset = [
                    outSituazioneConsumo, outSituazioneCosto, outPanoPotenza, outPanoAccumulo,
                    outPanoProduzione, outPanoCostoImpianto, outPanoIncentivoPNRR, outPanoCostoReale,
                    outPanoRisparmio1, outPanoGuadagno1, outPanoTotale1, kpiPayback, kpiBenefit,
                    kpiTotalGain, outMassimaleApplicato
                ];
                uiElementsToReset.forEach(el => { el.textContent = '-'; });
                outPanoProduzioneNota.textContent = '';
                
                const defaultAnni = defaultValues['simulazione-anni'];
                outTotalGainLabel.textContent = `Guadagno a ${defaultAnni} Anni`;
                outTableTitle.textContent = `Flusso di Cassa (${defaultAnni} Anni)`;
                outPaybackTableTitle.textContent = `Piano di Rientro (${defaultAnni} Anni)`;

                if (paybackChart) {
                    paybackChart.destroy();
                    paybackChart = null;
                }
                
                detailsSection.classList.add('hidden');
                document.getElementById('calculator-form').scrollIntoView({ behavior: 'smooth' });
            }
        }

        // --- 7. GESTORI DI EVENTI (Il "Controllore") ---

        function handleCalculateClick() {
            if (!validateInputs()) {
                alert("Controlla i valori di input: alcuni sono invalidi (es. vuoti, < 0 dove non concesso).");
                return;
            }
            try {
                const inputs = getInputs();
                
                if (inputs.consumoF1 + inputs.consumoF2 + inputs.consumoF3 <= 0 && (inputs.potenzaInstallata > 0 || inputs.costoTotaleImpianto > 0)) {
                    if (!confirm("Attenzione: i consumi totali (F1+F2+F3) sono a zero. I calcoli di risparmio e rientro non saranno significativi. Vuoi continuare lo stesso?")) {
                        return;
                    }
                }

                const results = calculateFinancials(inputs);
                
                pdfResults = results;
                calcoliEseguiti = true;

                updateUI(results);

                if (!detailsSection.classList.contains('hidden')) {
                    detailsContent.innerHTML = populateCalculationDetails();
                }
                
                document.getElementById('situazione-attuale-section').scrollIntoView({ behavior: 'smooth' });

            } catch (e) {
                console.error("Errore during il calcolo:", e);
                alert("Si è verificato un errore during il calcolo. Controlla la console per i dettagli.");
            }
        }

        // Collegamento Eventi
        calculateBtn.addEventListener('click', handleCalculateClick);
        
        // NUOVI LISTENER PER ESPORTAZIONE
        exportSummaryPdfBtn.addEventListener('click', () => {
            const includeDetails = inIncludeDetails.checked;
            exportSummaryPdf(includeDetails);
        });
        exportDetailsPdfBtn.addEventListener('click', exportDetailsPdf);
        
        resetBtn.addEventListener('click', resetForm);

        toggleDetailsBtn.addEventListener('click', () => {
            const isHidden = detailsSection.classList.contains('hidden');
            if (isHidden) {
                detailsContent.innerHTML = populateCalculationDetails();
                detailsSection.classList.remove('hidden');
                toggleDetailsBtn.textContent = "Nascondi Dettaglio Calcoli";
                detailsSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                detailsSection.classList.add('hidden');
                toggleDetailsBtn.textContent = "Mostra Dettaglio Calcoli";
                toggleDetailsBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        hideDetailsBtnBottom.addEventListener('click', () => {
            detailsSection.classList.add('hidden');
            toggleDetailsBtn.textContent = "Mostra Dettaglio Calcoli";
            toggleDetailsBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        const allFormInputs = [...allNumberInputs, ...allTextInputs, ...allSelects];
        allFormInputs.forEach(input => {
            input.addEventListener('input', () => {
                validateInputs();
                const recInputs = ['consumo-f1', 'consumo-f2', 'consumo-f3', 'area-geografica', 'profilo-consumo', 'efficienza-batteria'];
                if (recInputs.includes(input.id)) {
                    updateRecommendations();
                }
                saveState();
            });
        });
        
        // --- 8. INIZIALIZZAZIONE ---
        loadState();
        
        const defaultAnni = inSimulazioneAnni.value || defaultValues['simulazione-anni'];
        outTotalGainLabel.textContent = `Guadagno a ${defaultAnni} Anni`;
        outTableTitle.textContent = `Flusso di Cassa (${defaultAnni} Anni)`;
        outPaybackTableTitle.textContent = `Piano di Rientro (${defaultAnni} Anni)`;

        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(reg => {
                    console.log('Service Worker registrato:', reg);
                }).catch(err => {
                    console.error('Errore registrazione Service Worker:', err);
                });
            });
        }

    } catch (error) {
        console.error("Errore critico durante l'inizializzazione dell'app:", error);
        document.body.innerHTML = `<div class="p-4 m-4 text-red-700 bg-red-100 border border-red-400 rounded"><strong>Errore Critico:</strong> L'applicazione non è riuscita a caricare. Controlla la console per i dettagli. <br><br><strong>Dettagli:</strong> ${error.message}</div>`;
    }

});

