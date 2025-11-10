try {
    // Assegniamo le librerie
    window.jsPDF = window.jspdf.jsPDF;

    // Riferimenti DOM
    const calculateBtn = document.getElementById('calculate-btn');
    const toggleDetailsBtn = document.getElementById('toggle-details-btn');
    const hideDetailsBtnBottom = document.getElementById('hide-details-btn-bottom'); 
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const resetBtn = document.getElementById('reset-btn');
    const detailsSection = document.getElementById('calcoli-dettaglio');
    const detailsContent = document.getElementById('calcoli-dettaglio-content');
    const kpiPayback = document.getElementById('payback-result');
    const kpiBenefit = document.getElementById('benefit-result');
    const kpiTotalGain = document.getElementById('total-gain-result');
    const tableBody = document.getElementById('payback-table-body');
    const ctx = document.getElementById('payback-chart').getContext('2d');
    const allInputs = document.querySelectorAll('#calculator-form input[type="number"]');
    let paybackChart = null;

    // Riferimenti input
    const inConsumoF1 = document.getElementById('consumo-f1');
    const inConsumoF2 = document.getElementById('consumo-f2');
    const inConsumoF3 = document.getElementById('consumo-f3');
    const inProduzioneKwhKwp = document.getElementById('produzione-kwh-kwp');
    const inAutoconsumoPerc = document.getElementById('autoconsumo-perc-desiderata');
    const inPotenzaInstallata = document.getElementById('potenza-pv-installata');
    const inPotenzaInverter = document.getElementById('potenza-inverter-installato');
    const inAccumuloInstallato = document.getElementById('accumulo-installato');
    const inCostoImpianto = document.getElementById('costo-totale-impianto');
    const inCostoEnergIA = document.getElementById('costo-energia');
    const inCostiFissi = document.getElementById('costi-fissi-bolletta');
    const inInflazione = document.getElementById('inflazione-annua');
    const inDegrado = document.getElementById('degrado-annuo');
    const inPercPNRR = document.getElementById('perc-pnrr');
    const inTariffaCER = document.getElementById('tariffa-cer');
    const inPercCondivisa = document.getElementById('perc-energia-condivisa-cer');
    const inPrezzoRID = document.getElementById('prezzo-rid');

    // Riferimenti output
    const outConsumoAnnuoTotale = document.getElementById('consumo-annuo-totale');
    const outPotenzaConsigliata = document.getElementById('potenza-consigliata-result');
    const outConsiglioAccumulo = document.getElementById('accumulo-consigliato-result');
    const outConsiglioAccumuloRagione = document.getElementById('accumulo-consigliato-ragione');
    const outSituazioneConsumo = document.getElementById('situazione-consumo-totale');
    const outSituazioneCosto = document.getElementById('situazione-costo-attuale');
    const outPanoPotenza = document.getElementById('panoramica-potenza');
    const outPanoAccumulo = document.getElementById('panoramica-accumulo');
    const outPanoProduzione = document.getElementById('panoramica-produzione');
    const outPanoCostoImpianto = document.getElementById('panoramica-costo-impianto');
    const outPanoIncentivoPNRR = document.getElementById('panoramica-incentivo-pnrr');
    const outPanoCostoReale = document.getElementById('panoramica-costo-reale');
    const outPanoRisparmio1 = document.getElementById('panoramica-risparmio-anno1');
    const outPanoGuadagno1 = document.getElementById('panoramica-guadagno-anno1');
    const outPanoTotale1 = document.getElementById('panoramica-totale-anno1');
    const outMassimaleApplicato = document.getElementById('massimale-applicato-result');
    
    let calcoliEseguiti = false;
    let pdfResults = {};

    const defaultValues = {
        'consumo-f1': '1500',
        'consumo-f2': '1800',
        'consumo-f3': '1700',
        'produzione-kwh-kwp': '1300',
        'autoconsumo-perc-desiderata': '60',
        'potenza-pv-installata': '6',
        'potenza-inverter-installato': '6',
        'accumulo-installato': '0',
        'costo-totale-impianto': '12000',
        'costo-energia': '0.25',
        'costi-fissi-bolletta': '120',
        'inflazione-annua': '2',
        'degrado-annuo': '0.5',
        'perc-pnrr': '40',
        'tariffa-cer': '0.11',
        'perc-energia-condivisa-cer': '70',
        'prezzo-rid': '0.08'
    };

    function validateInputs() {
        let isValid = true;
        allInputs.forEach(input => {
            input.classList.remove('input-invalid', 'input-valid');
            if (input.min && parseFloat(input.value) < parseFloat(input.min)) {
                input.classList.add('input-invalid');
                isValid = false;
            } else if (input.max && parseFloat(input.value) > parseFloat(input.max)) {
                input.classList.add('input-invalid');
                isValid = false;
            } else if (isNaN(parseFloat(input.value))) {
                 input.classList.add('input-invalid');
                isValid = false;
            } else {
                input.classList.add('input-valid');
            }
        });
        return isValid;
    }

    function updateRecommendations() {
        try {
            const consumoF1 = parseFloat(inConsumoF1.value) || 0;
            const consumoF2 = parseFloat(inConsumoF2.value) || 0;
            const consumoF3 = parseFloat(inConsumoF3.value) || 0;
            const produzione_per_kWp = parseFloat(inProduzioneKwhKwp.value) || 1300;
            const autoconsumoPercDesiderata = parseFloat(inAutoconsumoPerc.value) || 0;
            const consumoTotale = consumoF1 + consumoF2 + consumoF3;

            outConsumoAnnuoTotale.textContent = `${consumoTotale.toFixed(0)} kWh`;
            if (consumoTotale > 0 && produzione_per_kWp > 0) {
                const potenzaConsigliata_kWp = Math.round((consumoTotale / produzione_per_kWp) * 2) / 2;
                outPotenzaConsigliata.textContent = `${potenzaConsigliata_kWp.toFixed(1)} kWp`;
                const produzioneAnnuaConsigliata = potenzaConsigliata_kWp * produzione_per_kWp;
                const kwhDaAutoconsumare = produzioneAnnuaConsigliata * (autoconsumoPercDesiderata / 100);

                const consumoContemporaneoStimato = consumoF1 + (consumoF2 * 0.3);
                let kwhDaSpostare = Math.max(0, kwhDaAutoconsumare - consumoContemporaneoStimato);
                kwhDaSpostare = Math.min(kwhDaSpostare, (consumoF2 * 0.7) + consumoF3);
                const consumoGiornalieroDaSpostare = kwhDaSpostare / 365;
                const accumuloConsigliato_kWh = consumoGiornalieroDaSpostare / 0.8;
                if (accumuloConsigliato_kWh > 1.0) {
                    outConsiglioAccumulo.textContent = `Sì, ${accumuloConsigliato_kWh.toFixed(1)} kWh`;
                    outConsiglioAccumuloRagione.textContent = `Necessari per raggiungere l'obiettivo del ${autoconsumoPercDesiderata}% di autoconsumo.`;
                } else {
                    outConsiglioAccumulo.textContent = `No (valutare)`;
                    outConsiglioAccumuloRagione.textContent = `Consumi F2/F3 o obiettivo di autoconsumo non giustificano un accumulo.`;
                }
            } else {
                outPotenzaConsigliata.textContent = '- kWp';
                outConsiglioAccumulo.textContent = '-';
                outConsiglioAccumuloRagione.textContent = '';
            }
        } catch (error) {
            console.error("Errore in updateRecommendations:", error);
        }
    }
    
    function formatCurrency(value) {
        if (typeof value !== 'number' || isNaN(value)) value = 0;
        return value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }).replace(/\s/g, '');
    }

    function populateCalculationDetails() {
        try {
            const r = pdfResults;
            if (Object.keys(r).length === 0) {
                return "<p class='text-red-500'>Dati non ancora calcolati. Premi 'Calcola' prima.</p>";
            }
            if (r.consumoTotale === undefined || r.costoQuotaEnergia === undefined || r.costiFissiBolletta === undefined) {
                throw new Error("Dati situazioneattuale mancanti");
            }
            if (r.potenzaInstallata === undefined || r.produzione_per_kWp === undefined || r.autoconsumoPerc === undefined || r.kwhAutoconsumati === undefined || r.kwhImmessi === undefined || r.kwhCondivisi === undefined) {
                throw new Error("Dati produzione e consumi mancanti");
            }
            if (r.risparmioAutoconsumo === undefined || r.guadagnoRID === undefined || r.guadagnoCER === undefined || r.totaleBeneficiPrimoAnno === undefined) {
                throw new Error("Dati benefici economici mancanti");
            }
            if (r.potenzaPerCalcoloPNRR === undefined || r.massimale_kwp_dinamico === undefined || r.spesaMassimaleAmmissibile === undefined || r.costoAmmissibilePotenza === undefined || r.importoIncentivoPNRR === undefined || r.costoRealeCliente === undefined || r.percPNRR === undefined || r.costoTotaleImpianto === undefined) {
                throw new Error("Dati incentivo PNRR mancanti");
            }
            if (r.inflazioneAnnua === undefined || r.degradoAnnua === undefined) {
                throw new Error("Dati parametri aggiuntivi mancanti");
            }

            const html = `
                <h4>0. Situazione Attuale</h4>
                <ul>
                    <li>Costo Variabile: ${r.consumoTotale.toFixed(0)} kWh * ${r.costoQuotaEnergia.toFixed(2)} €/kWh = ${ (r.consumoTotale * r.costoQuotaEnergia).toFixed(2)} €</li>
                    <li>Costo Fisso: ${r.costiFissiBolletta.toFixed(2)} €</li>
                    <li>Costo Totale Attuale: <strong>${r.costoAttualeAnnuo.toFixed(2)} €</strong></li>
                </ul>
                <h4>1. Produzione e Consumi (Anno 1)</h4>
                <ul>
                    <li>Produzione Annua Stimata: ${r.potenzaInstallata.toFixed(1)} kWp * ${r.produzione_per_kWp} kWh/kWp = <strong>${r.produzioneAnnua.toFixed(0)} kWh</strong></li>
                    <li>kWh Autoconsumati: ${r.produzioneAnnua.toFixed(0)} kWh * ${r.autoconsumoPerc * 100}% (Obiettivo) = <strong>${r.kwhAutoconsumati.toFixed(0)} kWh</strong></li>
                    <li>kWh Immessi in Rete: ${r.produzioneAnnua.toFixed(0)} - ${r.kwhAutoconsumati.toFixed(0)} = <strong>${r.kwhImmessi.toFixed(0)} kWh</strong></li>
                    <li>kWh Condivisi (CER): ${r.kwhImmessi.toFixed(0)} kWh * ${r.percEnergiaCondivisa * 100}% (Stima) = <strong>${r.kwhCondivisi.toFixed(0)} kWh</strong></li>
                </ul>
                <h4>2. Benefici Economici (Anno 1)</h4>
                <ul>
                    <li>Risparmio (da Autoconsumo): ${r.kwhAutoconsumati.toFixed(0)} kWh * ${r.costoQuotaEnergia.toFixed(2)} €/kWh = <strong>${r.risparmioAutoconsumo.toFixed(2)} €</strong></li>
                    <li>Guadagno (RID): ${r.kwhImmessi.toFixed(0)} kWh * ${r.prezzoRID.toFixed(2)} €/kWh = <strong>${r.guadagnoRID.toFixed(2)} €</strong></li>
                    <li>Guadagno (Premio CER): ${r.kwhCondivisi.toFixed(0)} kWh * ${r.tariffaCER.toFixed(2)} €/kWh = <strong>${r.guadagnoCER.toFixed(2)} €</strong></li>
                    <li>Totale Benefici 1° Anno: ${r.risparmioAutoconsumo.toFixed(2)} + ${r.guadagnoImmissione.toFixed(2)} = <strong>${r.totaleBeneficiPrimoAnno.toFixed(2)} €</strong></li>
                </ul>
                <h4>3. Calcolo Incentivo PNRR</h4>
                <ul>
                    <li>Potenza Ammissibile: min(${r.potenzaInstallata.toFixed(1)} kWp PV, ${r.potenzaInverterInstallata.toFixed(1)} kW Inv) = <strong>${r.potenzaPerCalcoloPNRR.toFixed(1)} kW</strong></li>
                    <li>Massimale Applicabile: <strong>${r.massimale_kwp_dinamico.toLocaleString('it-IT')} €/kW</strong></li>
                    <li>Spesa Massima Ammissibile: ${r.potenzaPerCalcoloPNRR.toFixed(1)} kW * ${r.massimale_kwp_dinamico.toLocaleString('it-IT')} € = <strong>${r.spesaMassimaleAmmissibile.toFixed(2)} €</strong></li>
                    <li>Costo Ammissibile (min(Costo Impianto, Spesa Max)): min(${r.costoTotaleImpianto.toFixed(2)} €, ${r.spesaMassimaleAmmissibile.toFixed(2)} €) = <strong>${r.costoAmmissibilePotenza.toFixed(2)} €</strong></li>
                    <li>Importo Incentivo: ${r.costoAmmissibilePotenza.toFixed(2)} € * ${r.percPNRR * 100}% = <strong>${r.importoIncentivoPNRR.toFixed(2)} €</strong></li>
                    <li>Costo Reale Cliente: ${r.costoTotaleImpianto.toFixed(2)} € - ${r.importoIncentivoPNRR.toFixed(2)} € = <strong>${r.costoRealeCliente.toFixed(2)} €</strong></li>
                </ul>
                <h4>4. Parametri Aggiuntivi</h4>
                <ul>
                    <li>Inflazione Annua: ${r.inflazioneAnnua}%</li>
                    <li>Degrado Annua Produzione: ${r.degradoAnnua}%</li>
                </ul>
            `;
            return html;
        } catch (error) {
            console.error("Errore in populateCalculationDetails:", error);
            return "<p class='text-red-500'>Errore durante la generazione dei dettagli: " + error.message + ". Controlla la console per dettagli completi.</p>";
        }
    }
    
    // ========= FUNZIONE ESPORTA PDF (CON SPIEGAZIONI E LOGO) =========
    async function exportToPdf() {
        if (!calcoliEseguiti) {
            alert("Devi prima cliccare su 'Calcola Rientro Finanziario'.");
            return;
        }
        const btn = exportPdfBtn;
        const originalText = btn.innerHTML;
        btn.textContent = 'Creazione PDF in corso...';
        btn.disabled = true;

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            pdf.setFont('helvetica', 'normal');

            const r = pdfResults;
            if (!r || Object.keys(r).length === 0) {
                throw new Error("Dati dei risultati non disponibili.");
            }

            // --- IMPOSTAZIONI DI STILE PDF ---
            const margin = 20;
            const usableWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
            let cursorY = margin;
            const h1Size = 20;
            const h2Size = 16;
            const bodySize = 10;
            const smallSize = 8;
            const lineSpacing = 6;
            const sectionSpacing = 10;
            const cardSpacing = 8;
            const cardHeight = 25;
            const cardRadius = 3;
            const cardPadding = 5;
            const cardWidth = (usableWidth - cardSpacing) / 2;

            // Colori
            const colorIndigo = '#4f46e5';
            const colorGreen = '#059669';
            const colorRed = '#DC2626';
            const colorTextDark = '#1f2937';
            const colorTextLight = '#ffffff';
            const colorTextGray = '#4b5563';
            const colorTextLightGray = '#f3f4f6';
            const colorBgLight = '#ffffff';
            const colorBgDark = '#991b1b'; // Sfondo "pain point"
            const colorBorderLight = '#e5e7eb';
            const colorBgSummaryGreen = '#f0fdf4';
            const colorBorderSummaryGreen = '#16a34a';
            const colorBgSummaryBlue = '#eff6ff';
            const colorBorderSummaryBlue = colorIndigo;
            // --- NUOVI COLORI PER CARD ROSSA ---
            const colorBgSummaryRed = '#fef2f2'; // Sfondo rosso chiaro (Tailwind 'red-50')
            const colorBorderSummaryRed = '#DC2626';
            // --- FINE IMPOSTAZIONI STILE ---

            const checkPageBreak = (heightNeeded) => {
                if (cursorY + heightNeeded > (pdf.internal.pageSize.getHeight() - margin)) {
                    pdf.addPage();
                    cursorY = margin;
                }
            };

            // ========= NUOVA FUNZIONE HELPER PER LE SPIEGAZIONI =========
            const drawExplanationBox = (rawText) => {
                const textPadding = 4;
                const textMargin = margin + textPadding + 3; // 3mm Bordo
                const textWidth = usableWidth - (textPadding * 2) - 6; // Larghezza testo
                
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(smallSize); // 8pt
                pdf.setTextColor(colorTextGray);

                const textLines = pdf.splitTextToSize(rawText, textWidth);
                const textHeight = textLines.length * 3.5; // Altezza stimata
                const boxHeight = textHeight + (textPadding * 2);

                checkPageBreak(boxHeight + sectionSpacing);

                // Disegna la box (stile originale)
                pdf.setFillColor('#f9fafb'); // bg-gray-50
                pdf.setDrawColor(colorBorderLight); // Bordo grigio
                pdf.setLineWidth(0.5);
                pdf.roundedRect(margin, cursorY, usableWidth, boxHeight, cardRadius, cardRadius, 'FD');
                
                // Disegna la linea blu a sinistra
                pdf.setFillColor(colorIndigo);
                pdf.roundedRect(margin, cursorY, 1.5, boxHeight, cardRadius, cardRadius, 'F');

                // Stampa il testo
                let textY = cursorY + textPadding + 3; // +3 per altezza font
                for (const line of textLines) {
                    pdf.text(line, textMargin, textY);
                    textY += 4; // Interlinea
                }
                
                cursorY += boxHeight + sectionSpacing;
            };
            // =============================================================

            // ---- INIZIO PDF ----

            // TITOLO (Con Logo)
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(h1Size);
            pdf.setTextColor(colorIndigo);
            pdf.text('SolarisFlow - Riepilogo', margin, cursorY);
            cursorY += lineSpacing + 2;

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(bodySize);
            pdf.setTextColor(colorTextGray);
            let introText = `Ecco l'analisi di fattibilità e il piano di rientro per il tuo impianto. Simulazione basata su: Inflazione ${r.inflazioneAnnua.toFixed(1)}%, Degrado ${r.degradoAnnua.toFixed(1)}%.`;
            let splitIntro = pdf.splitTextToSize(introText, usableWidth);
            pdf.text(splitIntro, margin, cursorY);
            cursorY += (splitIntro.length * (lineSpacing * 0.7)) + sectionSpacing;

            // --- SEZIONE 1: SITUAZIONE ATTUALE ---
            checkPageBreak(cardHeight + sectionSpacing);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(h2Size);
            pdf.setTextColor(colorTextDark);
            pdf.text('Situazione Attuale (Senza Impianto)', margin, cursorY);
            cursorY += lineSpacing + 2;

            // Card 1 (Consumo - Light)
            pdf.setFillColor(colorBgLight);
            pdf.setDrawColor(colorBorderLight);
            pdf.roundedRect(margin, cursorY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
            pdf.setFontSize(smallSize);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(colorTextGray);
            pdf.text('CONSUMO ANNUO TOTALE', margin + cardPadding, cursorY + 8);
            pdf.setFontSize(h2Size);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(colorTextDark);
            pdf.text(`${r.consumoTotale.toFixed(0)} kWh`, margin + cardPadding, cursorY + 18);

            // Card 2 (Costo - Light Red Style)
            pdf.setFillColor(colorBgSummaryRed); // <-- Sfondo rosso chiaro
            pdf.setDrawColor(colorBorderSummaryRed); // <-- Bordo rosso pieno
            pdf.roundedRect(margin + cardWidth + cardSpacing, cursorY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
            pdf.setFontSize(smallSize);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(colorTextGray); // <-- Titolo in grigio scuro
            pdf.text('COSTO BOLLETTA ANNUO STIMATO', margin + cardWidth + cardSpacing + cardPadding, cursorY + 8);
            pdf.setFontSize(h2Size);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(colorRed); // <-- Valore in rosso acceso
            pdf.text(formatCurrency(r.costoAttualeAnnuo), margin + cardWidth + cardSpacing + cardPadding, cursorY + 18);

            cursorY += cardHeight + sectionSpacing;

            // --- SPIEGAZIONE 1 ---
            drawExplanationBox(`Costo Attuale: Questo è il costo stimato che sostieni ogni anno, calcolato sommando i tuoi consumi per la quota energia (${formatCurrency(r.costoQuotaEnergia)}/kWh) e i costi fissi (${formatCurrency(r.costiFissiBolletta)}).`);
            
            // --- SEZIONE 2: NUOVO IMPIANTO ---
            checkPageBreak(cardHeight * 2 + cardSpacing + sectionSpacing);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(h2Size);
            pdf.setTextColor(colorTextDark);
            pdf.text('Il Tuo Nuovo Impianto Fotovoltaico', margin, cursorY);
            cursorY += lineSpacing + 2;

            let cardY = cursorY;
            // Card 1 (Potenza - Light)
            pdf.setFillColor(colorBgLight);
            pdf.setDrawColor(colorBorderLight);
            pdf.roundedRect(margin, cardY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
            pdf.setFontSize(smallSize);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(colorTextGray);
            pdf.text('POTENZA IMPIANTO (PV)', margin + cardPadding, cardY + 8);
            pdf.setFontSize(h2Size);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(colorTextDark);
            pdf.text(`${r.potenzaInstallata.toFixed(1)} kWp`, margin + cardPadding, cardY + 18);
            
            // Card 2 (Accumulo - Light)
            pdf.setFillColor(colorBgLight);
            pdf.setDrawColor(colorBorderLight);
            pdf.roundedRect(margin + cardWidth + cardSpacing, cardY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
            pdf.setFontSize(smallSize);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(colorTextGray);
            pdf.text('ACCUMULO', margin + cardWidth + cardSpacing + cardPadding, cardY + 8);
            pdf.setFontSize(h2Size);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(colorTextDark);
            pdf.text(`${r.accumuloInstallato.toFixed(1)} kWh`, margin + cardWidth + cardSpacing + cardPadding, cardY + 18);
            
            cardY += cardHeight + cardSpacing;

            // Card 3 (Produzione - Light)
            pdf.setFillColor(colorBgLight);
            pdf.setDrawColor(colorBorderLight);
            pdf.roundedRect(margin, cardY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
            pdf.setFontSize(smallSize);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(colorTextGray);
            pdf.text('PRODUZIONE ANNUA STIMATA', margin + cardPadding, cardY + 8);
            pdf.setFontSize(h2Size);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(colorTextDark);
            pdf.text(`${r.produzioneAnnua.toFixed(0)} kWh`, margin + cardPadding, cardY + 18);

            // Card 4 (% Autoconsumo - Light)
            pdf.setFillColor(colorBgLight);
            pdf.setDrawColor(colorBorderLight);
            pdf.roundedRect(margin + cardWidth + cardSpacing, cardY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
            pdf.setFontSize(smallSize);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(colorTextGray);
            pdf.text('% AUTOCONSUMO OBIETTIVO', margin + cardWidth + cardSpacing + cardPadding, cardY + 8);
            pdf.setFontSize(h2Size);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(colorTextDark);
            pdf.text(`${(r.autoconsumoPerc * 100).toFixed(0)}%`, margin + cardWidth + cardSpacing + cardPadding, cardY + 18);
            
            cursorY = cardY + cardHeight + sectionSpacing;

            // --- SEZIONE 3: COSTI E INCENTIVI ---
            checkPageBreak(cardHeight * 2 + cardSpacing + sectionSpacing);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(h2Size);
            pdf.setTextColor(colorTextDark);
            pdf.text('Analisi Costi e Incentivi', margin, cursorY);
            cursorY += lineSpacing + 2;
            cardY = cursorY;

            // Card 1 (Costo Impianto - Light)
            pdf.setFillColor(colorBgLight);
            pdf.setDrawColor(colorBorderLight);
            pdf.roundedRect(margin, cardY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
            pdf.setFontSize(smallSize);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(colorTextGray);
            pdf.text('COSTO TOTALE IMPIANTO', margin + cardPadding, cardY + 8);
            pdf.setFontSize(h2Size);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(colorTextDark);
            pdf.text(formatCurrency(r.costoTotaleImpianto), margin + cardPadding, cardY + 18);
            
            // Card 2 (Incentivo - Light)
            pdf.setFillColor(colorBgLight);
            pdf.setDrawColor(colorBorderLight);
            pdf.roundedRect(margin + cardWidth + cardSpacing, cardY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
            pdf.setFontSize(smallSize);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(colorTextGray);
            pdf.text('INCENTIVO PNRR (Fondo Perduto)', margin + cardWidth + cardSpacing + cardPadding, cardY + 8);
            pdf.setFontSize(h2Size);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(colorGreen);
            pdf.text(formatCurrency(r.importoIncentivoPNRR), margin + cardWidth + cardSpacing + cardPadding, cardY + 18);
            
            cardY += cardHeight + cardSpacing;

            // Card RIEPILOGO COSTO (Light Blue Summary)
            pdf.setFillColor(colorBgSummaryBlue);
            pdf.setDrawColor(colorBorderSummaryBlue);
            pdf.roundedRect(margin, cardY, usableWidth, cardHeight, cardRadius, cardRadius, 'FD');
            pdf.setFontSize(smallSize);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(colorTextGray);
            pdf.text('COSTO REALE PER IL CLIENTE', margin + cardPadding, cardY + 8);
            pdf.setFontSize(h2Size);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(colorIndigo);
            pdf.text(formatCurrency(r.costoRealeCliente), margin + cardPadding, cardY + 18);
            
            cursorY = cardY + cardHeight + sectionSpacing;

            // --- SPIEGAZIONE 2 ---
            drawExplanationBox(`Incentivo PNRR: L'incentivo a fondo perduto del ${r.percPNRR * 100}% è calcolato sul valore minore tra il costo dell'impianto (${formatCurrency(r.costoTotaleImpianto)}) e la spesa massima ammissibile (${formatCurrency(r.spesaMassimaleAmmissibile)}), basata su una potenza di ${r.potenzaPerCalcoloPNRR.toFixed(1)} kW.`);

            // --- SEZIONE 4: BENEFICI 1° ANNO ---
            checkPageBreak(cardHeight * 2 + cardSpacing + sectionSpacing);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(h2Size);
            pdf.setTextColor(colorTextDark);
            pdf.text('Riepilogo Benefici (Primo Anno)', margin, cursorY);
            cursorY += lineSpacing + 2;
            cardY = cursorY;

            // Card 1 (Risparmio - Light)
            pdf.setFillColor(colorBgLight);
            pdf.setDrawColor(colorBorderLight);
            pdf.roundedRect(margin, cardY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
            pdf.setFontSize(smallSize);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(colorTextGray);
            pdf.text('RISPARMIO DA AUTOCONSUMO', margin + cardPadding, cardY + 8);
            pdf.setFontSize(h2Size);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(colorGreen);
            pdf.text(formatCurrency(r.risparmioAutoconsumo), margin + cardPadding, cardY + 18);

            // Card 2 (Guadagno - Light)
            pdf.setFillColor(colorBgLight);
            pdf.setDrawColor(colorBorderLight);
            pdf.roundedRect(margin + cardWidth + cardSpacing, cardY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
            pdf.setFontSize(smallSize);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(colorTextGray);
            pdf.text('GUADAGNO (RID + PREMIO CER)', margin + cardWidth + cardSpacing + cardPadding, cardY + 8);
            pdf.setFontSize(h2Size);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(colorGreen);
            pdf.text(formatCurrency(r.guadagnoImmissione), margin + cardWidth + cardSpacing + cardPadding, cardY + 18);
            
            cardY += cardHeight + cardSpacing;

            // Card RIEPILOGO BENEFICI (Light Green Summary)
            pdf.setFillColor(colorBgSummaryGreen);
            pdf.setDrawColor(colorBorderSummaryGreen);
            pdf.roundedRect(margin, cardY, usableWidth, cardHeight, cardRadius, cardRadius, 'FD');
            pdf.setFontSize(smallSize);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(colorTextGray);
            pdf.text('TOTALE BENEFICI 1° ANNO', margin + cardPadding, cardY + 8);
            pdf.setFontSize(h2Size);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(colorGreen);
            pdf.text(formatCurrency(r.totaleBeneficiPrimoAnno), margin + cardPadding, cardY + 18);
            
            cursorY = cardY + cardHeight + sectionSpacing;

            // --- SPIEGAZIONE 3 ---
            drawExplanationBox(`Come si generano i benefici:\n1. Risparmio: È l'energia che produci e consumi istantaneamente (${r.kwhAutoconsumati.toFixed(0)} kWh), evitando di acquistarla dalla rete.\n2. Guadagno: È l'energia che immetti in rete (${r.kwhImmessi.toFixed(0)} kWh), venduta tramite RID e incentivata dal premio CER.`);

            // --- SEZIONE 5: TEMPO DI RIENTRO ---
            checkPageBreak(cardHeight + sectionSpacing);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(h2Size);
            pdf.setTextColor(colorTextDark);
            pdf.text('Tempo di Rientro dell\'Investimento', margin, cursorY);
            cursorY += lineSpacing + 2;
            cardY = cursorY;

            // Card 1 (Tempo - Light Blue Summary)
            pdf.setFillColor(colorBgSummaryBlue);
            pdf.setDrawColor(colorBorderSummaryBlue);
            pdf.roundedRect(margin, cardY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
            pdf.setFontSize(smallSize);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(colorTextGray);
            pdf.text('TEMPO DI RIENTRO STIMATO', margin + cardPadding, cardY + 8);
            pdf.setFontSize(h2Size);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(colorIndigo);
            pdf.text(r.tempoDiRientro > 0 ? `${r.tempoDiRientro.toFixed(1)} Anni` : '> 25 Anni', margin + cardPadding, cardY + 18);

            // Card 2 (Guadagno Netto - Light Green Summary)
            pdf.setFillColor(colorBgSummaryGreen);
            pdf.setDrawColor(colorBorderSummaryGreen);
            pdf.roundedRect(margin + cardWidth + cardSpacing, cardY, cardWidth, cardHeight, cardRadius, cardRadius, 'FD');
            pdf.setFontSize(smallSize);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(colorTextGray);
            pdf.text('GUADAGNO NETTO A 25 ANNI', margin + cardWidth + cardSpacing + cardPadding, cardY + 8);
            pdf.setFontSize(h2Size);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(colorGreen);
            pdf.text(formatCurrency(r.guadagnoTotale25Anni), margin + cardWidth + cardSpacing + cardPadding, cardY + 18);

            cursorY = cardY + cardHeight + sectionSpacing;

            // --- SPIEGAZIONE 4 ---
            drawExplanationBox(`Tempo di Rientro: È il numero di anni necessari affinché i benefici totali (risparmi + guadagni) eguaglino il costo reale dell'investimento (${formatCurrency(r.costoRealeCliente)}). Il calcolo include degrado annuo (${r.degradoAnnua}%) e inflazione (${r.inflazioneAnnua}%).`);
            
            // --- SEZIONE 6: GRAFICO ---
            checkPageBreak(80); 
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(h2Size);
            pdf.setTextColor(colorTextDark);
            pdf.text('Flusso di Cassa Cumulato', margin, cursorY);
            cursorY += lineSpacing + 2;

            const chartCanvas = document.getElementById('payback-chart');
            const chartImgData = chartCanvas.toDataURL('image/png', 1.0);
            const chartHeight = (chartCanvas.height * usableWidth) / chartCanvas.width;
            pdf.addImage(chartImgData, 'PNG', margin, cursorY, usableWidth, chartHeight);
            cursorY += chartHeight + sectionSpacing;

            // --- SEZIONE 7: TABELLA PIANO DI RIENTRO ---
            checkPageBreak(50); 
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(h2Size);
            pdf.setTextColor(colorTextDark);
            pdf.text('Piano di Rientro (25 Anni)', margin, cursorY);
            cursorY += lineSpacing + 2;

            // Header tabella
            const tableX = margin;
            const tableY = cursorY;
            const colWidths = [20, (usableWidth-20)/4, (usableWidth-20)/4, (usableWidth-20)/4, (usableWidth-20)/4];
            let currentX = tableX;

            pdf.setFillColor(colorBgLight);
            pdf.rect(tableX, tableY, usableWidth, 10, 'F');
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(smallSize);
            pdf.setTextColor(colorTextGray);

            pdf.text('ANNO', currentX + 5, tableY + 7);
            currentX += colWidths[0];
            pdf.text('RISPARMIO', currentX + 5, tableY + 7);
            currentX += colWidths[1];
            pdf.text('GUADAGNO (RID+CER)', currentX + 5, tableY + 7);
            currentX += colWidths[2];
            pdf.text('FLUSSO DI CASSA', currentX + 5, tableY + 7);
            currentX += colWidths[3];
            pdf.text('CUMULATO', currentX + 5, tableY + 7);
            
            cursorY += 10;

            // Body tabella
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(bodySize - 1); 
            pdf.setTextColor(colorTextDark);
            const tableRows = document.getElementById('payback-table-body').rows;
            const rowHeight = 8;

            for (let i = 0; i < tableRows.length; i++) {
                checkPageBreak(rowHeight); 
                const row = tableRows[i];
                const cells = row.cells;
                
                currentX = tableX;
                
                if (i % 2 === 1) { // Sfondo alternato
                    pdf.setFillColor("#f9fafb"); // bg-gray-50
                    pdf.rect(tableX, cursorY, usableWidth, rowHeight, 'F');
                }

                // Cella 1 (Anno)
                pdf.text(cells[0].innerText, currentX + 5, cursorY + 6);
                currentX += colWidths[0];
                // Cella 2 (Risparmio)
                pdf.text(cells[1].innerText, currentX + 5, cursorY + 6);
                currentX += colWidths[1];
                // Cella 3 (Guadagno)
                pdf.text(cells[2].innerText, currentX + 5, cursorY + 6);
                currentX += colWidths[2];
                // Cella 4 (Flusso)
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(colorGreen);
                pdf.text(cells[3].innerText, currentX + 5, cursorY + 6);
                currentX += colWidths[3];
                // Cella 5 (Cumulato)
                pdf.setFont('helvetica', 'bold');
                let cumulatoValue = parseFloat(cells[4].innerText.replace(/[^0-9,-]+/g,"").replace('.','').replace(',', '.'));
                pdf.setTextColor(cumulatoValue < 0 ? colorRed : colorIndigo);
                pdf.text(cells[4].innerText, currentX + 5, cursorY + 6);

                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(colorTextDark);

                cursorY += rowHeight;
            }

            // ---- FINE PDF ----
            
            pdf.save('SolarisFlow-Riepilogo.pdf');

        } catch (err) {
            console.error("Errore durante l'esportazione PDF vettoriale:", err);
            alert("Si è verificato un errore durante la generazione del PDF: " + err.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }


    // Salvataggio e Caricamento Stato (LocalStorage)
    function saveState() {
        const state = {
            consumoF1: inConsumoF1.value,
            consumoF2: inConsumoF2.value,
            consumoF3: inConsumoF3.value,
            produzioneKwhKwp: inProduzioneKwhKwp.value,
            autoconsumoPercDesiderata: inAutoconsumoPerc.value,
            potenzaPvInstallata: inPotenzaInstallata.value,
            potenzaInverterInstallato: inPotenzaInverter.value,
            accumuloInstallato: inAccumuloInstallato.value,
            costoTotaleImpianto: inCostoImpianto.value,
            costoEnergia: inCostoEnergIA.value,
            costiFissiBolletta: inCostiFissi.value,
            inflazioneAnnua: inInflazione.value,
            degradoAnnua: inDegrado.value,
            percPnrr: inPercPNRR.value,
            tariffaCer: inTariffaCER.value,
            percEnergiaCondivisaCer: inPercCondivisa.value,
            prezzoRid: inPrezzoRID.value
        };
        localStorage.setItem('solarisFlowState', JSON.stringify(state));
    }

    function loadState() {
        const state = JSON.parse(localStorage.getItem('solarisFlowState'));
        if (state) {
            // Carica lo stato
            inConsumoF1.value = state.consumoF1 || defaultValues['consumo-f1'];
            inConsumoF2.value = state.consumoF2 || defaultValues['consumo-f2'];
            inConsumoF3.value = state.consumoF3 || defaultValues['consumo-f3'];
            inProduzioneKwhKwp.value = state.produzioneKwhKwp || defaultValues['produzione-kwh-kwp'];
            inAutoconsumoPerc.value = state.autoconsumoPercDesiderata || defaultValues['autoconsumo-perc-desiderata'];
            inPotenzaInstallata.value = state.potenzaPvInstallata || defaultValues['potenza-pv-installata'];
            inPotenzaInverter.value = state.potenzaInverterInstallato || defaultValues['potenza-inverter-installato'];
            inAccumuloInstallato.value = state.accumuloInstallato || defaultValues['accumulo-installato'];
            inCostoImpianto.value = state.costoTotaleImpianto || defaultValues['costo-totale-impianto'];
            inCostoEnergIA.value = state.costoEnergia || defaultValues['costo-energia'];
            inCostiFissi.value = state.costiFissiBolletta || defaultValues['costi-fissi-bolletta'];
            inInflazione.value = state.inflazioneAnnua || defaultValues['inflazione-annua'];
            inDegrado.value = state.degradoAnnua || defaultValues['degrado-annuo'];
            inPercPNRR.value = state.percPnrr || defaultValues['perc-pnrr'];
            inTariffaCER.value = state.tariffaCer || defaultValues['tariffa-cer'];
            inPercCondivisa.value = state.percEnergiaCondivisaCer || defaultValues['perc-energia-condivisa-cer'];
            inPrezzoRID.value = state.prezzoRid || defaultValues['prezzo-rid'];
        } else {
            // Se non c'è stato, carica i default
            allInputs.forEach(input => {
                input.value = defaultValues[input.id];
            });
        }
        updateRecommendations();
        validateInputs();
    }

    function resetForm() {
        if (confirm("Sei sicuro di voler resettare tutti i campi ai valori di default?")) {
            localStorage.removeItem('solarisFlowState');
            
            allInputs.forEach(input => {
                input.value = defaultValues[input.id];
                input.classList.remove('input-invalid', 'input-valid');
            });

            calcoliEseguiti = false;
            pdfResults = {};
            tableBody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-gray-500">Inserisci i dati e calcola per vedere i risultati.</td></tr>';
            outSituazioneConsumo.textContent = '- kWh';
            outSituazioneCosto.textContent = '- €';
            outPanoPotenza.textContent = '- kWp';
            outPanoAccumulo.textContent = '- kWh';
            outPanoProduzione.textContent = '- kWh';
            outPanoCostoImpianto.textContent = '- €';
            outPanoIncentivoPNRR.textContent = '- €';
            outPanoCostoReale.textContent = '- €';
            outPanoRisparmio1.textContent = '- €';
            outPanoGuadagno1.textContent = '- €';
            outPanoTotale1.textContent = '- €';
            kpiPayback.textContent = '-';
            kpiBenefit.textContent = '-';
            kpiTotalGain.textContent = '-';
            outMassimaleApplicato.textContent = '- €/kW';

            if (paybackChart) {
                paybackChart.destroy();
                paybackChart = null;
            }
            
            detailsSection.classList.add('hidden');
            
            updateRecommendations();
            
            document.getElementById('calculator-form').scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Event Listeners
    allInputs.forEach(input => {
        input.addEventListener('input', () => {
            validateInputs();
            updateRecommendations();
            saveState();
        });
    });

    toggleDetailsBtn.addEventListener('click', () => {
        const isHidden = detailsSection.classList.contains('hidden');
        if (isHidden) {
            if (calcoliEseguiti) {
                detailsContent.innerHTML = populateCalculationDetails();
            } else {
                detailsContent.innerHTML = `<p class="text-red-500">Premi prima "Calcola Rientro Finanziario" per vedere i dettagli.</p>`;
            }
            detailsSection.classList.remove('hidden');
            detailsSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            detailsSection.scrollIntoView({ behavior: 'smooth' });
        }
    });

    hideDetailsBtnBottom.addEventListener('click', () => {
        detailsSection.classList.add('hidden');
        toggleDetailsBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    exportPdfBtn.addEventListener('click', exportToPdf);
    resetBtn.addEventListener('click', resetForm);

    calculateBtn.addEventListener('click', () => {
        if (!validateInputs()) {
            alert("Controlla i valori di input: alcuni sono invalidi (es. vuoti, negativi o fuori range).");
            return;
        }
        try {
            const consumoF1 = parseFloat(inConsumoF1.value) || 0;
            const consumoF2 = parseFloat(inConsumoF2.value) || 0;
            const consumoF3 = parseFloat(inConsumoF3.value) || 0;
            const costoQuotaEnergia = parseFloat(inCostoEnergIA.value) || 0;
            const costiFissiBolletta = parseFloat(inCostiFissi.value) || 0;
            const autoconsumoPerc = parseFloat(inAutoconsumoPerc.value) / 100 || 0;
            const produzione_per_kWp = parseFloat(inProduzioneKwhKwp.value) || 0;
            const potenzaInstallata = parseFloat(inPotenzaInstallata.value) || 0;
            const potenzaInverterInstallata = parseFloat(inPotenzaInverter.value) || 0;
            const accumuloInstallato = parseFloat(inAccumuloInstallato.value) || 0;
            const costoTotaleImpianto = parseFloat(inCostoImpianto.value) || 0;
            const percPNRR = parseFloat(inPercPNRR.value) / 100 || 0;
            const tariffaCER = parseFloat(inTariffaCER.value) || 0;
            const percEnergiaCondivisa = parseFloat(inPercCondivisa.value) / 100 || 0;
            const prezzoRID = parseFloat(inPrezzoRID.value) || 0;
            const inflazioneAnnua = parseFloat(inInflazione.value) / 100 || 0;
            const degradoAnnua = parseFloat(inDegrado.value) / 100 || 0.005;

            const consumoTotale = consumoF1 + consumoF2 + consumoF3;
            const produzioneAnnua = potenzaInstallata * produzione_per_kWp;

            const potenzaPerCalcoloPNRR = Math.min(potenzaInstallata, potenzaInverterInstallata);
            const massimale_kwp_dinamico = (potenzaPerCalcoloPNRR <= 20) ? 1500 : 1200;
            const spesaMassimaleAmmissibile = potenzaPerCalcoloPNRR * massimale_kwp_dinamico;
            const costoAmmissibilePotenza = Math.min(costoTotaleImpianto, spesaMassimaleAmmissibile);
            const importoIncentivoPNRR = costoAmmissibilePotenza * percPNRR;
            const costoRealeCliente = costoTotaleImpianto - importoIncentivoPNRR;

            let kwhAutoconsumati = Math.min(produzioneAnnua * autoconsumoPerc, consumoTotale);
            const kwhImmessi = produzioneAnnua - kwhAutoconsumati;
            const kwhCondivisi = kwhImmessi * percEnergiaCondivisa;

            const risparmioAutoconsumo = kwhAutoconsumati * costoQuotaEnergia;
            const guadagnoRID = kwhImmessi * prezzoRID;
            const guadagnoCER = kwhCondivisi * tariffaCER;
            const guadagnoImmissione = guadagnoRID + guadagnoCER;
            const totaleBeneficiPrimoAnno = risparmioAutoconsumo + guadagnoImmissione;

            tableBody.innerHTML = '';
            let flussoCumulato = -costoRealeCliente;
            let tempoDiRientro = -1;
            let beneficioPrimoAnno = 0;
            const anniSimulazione = 25;

            const chartLabels = [];
            const chartData = [];
            chartLabels.push(0);
            chartData.push(flussoCumulato);

            for (let anno = 1; anno <= anniSimulazione; anno++) {
                const fattoreDegrado = Math.pow(1 - degradoAnnua, anno - 1);
                const fattoreInflazione = Math.pow(1 + inflazioneAnnua, anno - 1);
                const risparmioQuestoAnno = risparmioAutoconsumo * fattoreDegrado * fattoreInflazione;
                const guadagnoQuestoAnno = guadagnoImmissione * fattoreDegrado * fattoreInflazione;
                const flussoDiCassa = risparmioQuestoAnno + guadagnoQuestoAnno;
                flussoCumulato += flussoDiCassa;

                if (anno === 1) {
                    beneficioPrimoAnno = flussoDiCassa;
                }

                if (flussoCumulato >= 0 && tempoDiRientro === -1) {
                    const flussoAnnoPrecedente = flussoCumulato - flussoDiCassa;
                    tempoDiRientro = (anno - 1) + (-flussoAnnoPrecedente / flussoDiCassa);
                }

                const row = `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${anno}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${formatCurrency(risparmioQuestoAnno)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${formatCurrency(guadagnoQuestoAnno)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">${formatCurrency(flussoDiCassa)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold ${flussoCumulato < 0 ? 'text-red-600' : 'text-indigo-600'}">${formatCurrency(flussoCumulato)}</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
                chartLabels.push(anno);
                chartData.push(flussoCumulato);
            }

            const costoAttualeAnnuo = (consumoTotale * costoQuotaEnergia) + costiFissiBolletta;
            outSituazioneConsumo.textContent = `${consumoTotale.toFixed(0)} kWh`;
            outSituazioneCosto.textContent = `${formatCurrency(costoAttualeAnnuo)}`;

            outPanoPotenza.textContent = `${potenzaInstallata.toFixed(1)} kWp`;
            outPanoAccumulo.textContent = `${accumuloInstallato.toFixed(1)} kWh`;
            outPanoProduzione.textContent = `${produzioneAnnua.toFixed(0)} kWh`;
            outPanoCostoImpianto.textContent = `${formatCurrency(costoTotaleImpianto)}`;
            outPanoIncentivoPNRR.textContent = `${formatCurrency(importoIncentivoPNRR)}`;
            outPanoCostoReale.textContent = `${formatCurrency(costoRealeCliente)}`;
            outPanoRisparmio1.textContent = `${formatCurrency(risparmioAutoconsumo)}`;
            outPanoGuadagno1.textContent = `${formatCurrency(guadagnoImmissione)}`;
            outPanoTotale1.textContent = `${formatCurrency(totaleBeneficiPrimoAnno)}`;

            outMassimaleApplicato.textContent = `${massimale_kwp_dinamico.toLocaleString('it-IT')} €/kW (su ${potenzaPerCalcoloPNRR.toFixed(1)} kW)`;

            kpiPayback.textContent = tempoDiRientro > 0 ? `${tempoDiRientro.toFixed(1)}` : "> 25";
            kpiBenefit.textContent = `${beneficioPrimoAnno.toFixed(0)}`;
            kpiTotalGain.textContent = `${flussoCumulato.toFixed(0)}`;

            if (paybackChart) {
                paybackChart.destroy();
            }
            paybackChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: 'Flusso di Cassa Cumulato (€)',
                        data: chartData,
                        borderColor: 'rgb(79, 70, 229)',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        fill: true,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: { callback: value => formatCurrency(value) }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: context => `Anno ${context.label}: ${formatCurrency(context.raw)}`
                            }
                        }
                    }
                }
            });

            calcoliEseguiti = true;

            pdfResults = {
                consumoTotale, costoQuotaEnergia, costiFissiBolletta, costoAttualeAnnuo,
                potenzaInstallata, accumuloInstallato, produzioneAnnua, autoconsumoPerc,
                costoTotaleImpianto, importoIncentivoPNRR, costoRealeCliente,
                potenzaPerCalcoloPNRR, massimale_kwp_dinamico, spesaMassimaleAmmissibile, 
                costoAmmissibilePotenza,
                percPNRR,
                risparmioAutoconsumo, guadagnoImmissione, totaleBeneficiPrimoAnno,
                guadagnoRID, guadagnoCER,
                kwhAutoconsumati, kwhImmessi, kwhCondivisi,
                prezzoRID, tariffaCER, percEnergiaCondivisa, produzione_per_kWp, potenzaInverterInstallata,
                tempoDiRientro, guadagnoTotale25Anni: flussoCumulato,
                inflazioneAnnua: inflazioneAnnua * 100, degradoAnnua: degradoAnnua * 100
            };

            if (!detailsSection.classList.contains('hidden')) {
                detailsContent.innerHTML = populateCalculationDetails();
            }
            
            document.getElementById('situazione-attuale-section').scrollIntoView({ behavior: 'smooth' });

        } catch (e) {
            console.error("Errore durante il calcolo:", e);
            alert("Si è verificato un errore durante il calcolo. Controlla la console.");
        }
    });

    // Chiamata Iniziale
    loadState();

    // Registrazione Service Worker per PWA
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
    document.body.innerHTML = `<div class="p-4 m-4 text-red-700 bg-red-100 border border-red-400 rounded"><strong>Errore Critico:</strong> L'applicazione non è riuscita a caricare. Le librerie esterne potrebbero essere bloccate o non raggiungibili. <br><br><strong>Dettagli:</strong> ${error.message}</div>`;
}