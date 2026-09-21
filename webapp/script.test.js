const { handleFormSubmit } = require('./script');

describe('CV Generator Frontend', () => {
    let mockEvent;

    beforeEach(() => {
        document.body.innerHTML = `
            <form id="cvForm">
                <input type="text" id="jobTitle" value="Frontend Dev" />
                <textarea id="jobDescription">React, CSS</textarea>
                <button type="submit" id="submitBtn">Generar</button>
            </form>
            <div id="loadingState" class="hidden">Cargando...</div>
            <div id="resultState" class="hidden">
                <a id="downloadLink" href="#">Descargar PDF</a>
            </div>
            <div id="errorState" class="hidden">
                <p id="errorMsg"></p>
            </div>
        `;
        
        mockEvent = { preventDefault: jest.fn() };
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should show loading state and disable button on submit', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ url_pdf: 'http://example.com/cv.pdf' })
        });

        const promise = handleFormSubmit(mockEvent);
        
        expect(document.getElementById('submitBtn').disabled).toBe(true);
        expect(document.getElementById('loadingState').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('cvForm').classList.contains('hidden')).toBe(true);

        await promise;
    });

    it('should show result state and download link on successful fetch', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ url_pdf: 'https://studio.arecofix.com.ar/test.pdf' })
        });

        await handleFormSubmit(mockEvent);

        expect(document.getElementById('resultState').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('loadingState').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('downloadLink').href).toBe('https://studio.arecofix.com.ar/test.pdf');
    });

    it('should show error state if fetch fails', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false
        });

        await handleFormSubmit(mockEvent);

        expect(document.getElementById('errorState').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('loadingState').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('errorMsg').innerText).toBe('Error en la respuesta del servidor');
        expect(document.getElementById('cvForm').classList.contains('hidden')).toBe(false);
    });
});
