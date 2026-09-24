export class PdfParserService {
    static async extractText(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map(item => item.str);
            fullText += strings.join(' ') + '\n';
        }
        return fullText;
    }

    static extractBasicInfo(text) {
        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?[\d]{3,4}[-.\s]?[\d]{3,4}/);
        const linkedinMatch = text.match(/linkedin\.com\/in\/[^\s]+/i);
        const nameHeuristic = text.trim().split(/\s+/).slice(0, 3).join(' ');

        return {
            email: emailMatch ? emailMatch[0] : null,
            phone: phoneMatch ? phoneMatch[0] : null,
            linkedin: linkedinMatch ? 'https://' + linkedinMatch[0] : null,
            name: nameHeuristic
        };
    }
}
