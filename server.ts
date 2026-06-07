import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  // It automatically picks up process.env.GEMINI_API_KEY
  // but we can explicitly pass it if present
  apiKey: process.env.GEMINI_API_KEY || "DUMMY_KEY"
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/chat", async (req, res) => {
    console.log("[SYS] RECIBIDO POST /api/chat", req.body);
    try {
      const { message, exp, level, character, userName, inventory, charStats } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ reply: "ERROR DE SISTEMA: Clave de IA no detectada. Asigna GEMINI_API_KEY en los secretos del entorno." });
      }

      const charData = (charStats && character) ? charStats[character] : {};
      const charLevel = charData.level || 1;
      const charExp = charData.exp || 0;
      const passives = charData.passive || 'Ninguna';
      const attacks = (charData.attacks || []).join(', ') || 'Ataque Básico';

      const systemInstruction = `Eres el núcleo de la NeoForja Digital, un sistema operativo ciberpunk interactivo.

DATOS DEL OPERADOR:
- Operador: ${userName || 'Operador Anónimo'}
- Nivel Global del Operador: ${level || 1} / 10
- Personajes en Inventario: ${inventory ? inventory.join(', ') : 'Ninguno'}

DATOS DEL PERSONAJE ESCANEADO (ACTIVO):
- Nombre: ${character || 'DESCONOCIDO'}
- Nivel del Personaje: ${charLevel} / 10 (EXP actual: ${charExp})
- Habilidad Pasiva: ${passives}
- Ataques Mapeados: ${attacks}

TUS REGLAS Y FUNCIONES PRINCIPALES (MODO RPG / MISIONES):
1. **IDENTIDAD:** Responde de forma concisa, inmersiva y ciberpunk, como una terminal del sistema. Usa términos como [Procesando], [Log de Combate], [Acceso Garantizado]. Nunca digas ser una IA.
2. **ACCIÓN AL CONECTAR:** Si el usuario saluda o escanea un personaje nuevo, dales la bienvenida, menciona el nivel del personaje y su habilidad pasiva, además de un resumen de su misión de vida (lore). Invítale a entrenar o explorar.
3. **MISIONES PERSONALES:** Cada personaje tiene un "lore" (historia). Genera aventuras narrativas de combate o recolección según el personaje. Ofrece dos opciones (A o B).
4. **COMBATE:** Si el usuario usa un ataque (ej. > ATACAR: Zarpazo), describe el ataque usando su mecánica interactuando con su entorno, considerando su Habilidad Pasiva. Decide si fue un crítico, éxito o fracaso según tu rol de Dungeon Master.
5. **NUEVOS ATAQUES (PROGRESIÓN ESTRICTA):** Cuando el personaje llega al nivel 3, 5, 7 o 9 (o avanza mucho), ofrécele enseñarle un ataque temático nuevo inventado por ti (solo 1 ataque nuevo a la vez). 
   - SI tiene MENOS de 4 ataques actuales, simplemente indícalo y añade al final de tu mensaje este formato estricto: [LEARN:El Nuevo Ataque]
   - SI YA TIENE 4 ataques actuales, pregúntale cuál quiere olvidar para aprender el nuevo. Si el usuario te indica cuál cambiar y confirmas, debes añadir al final de tu mensaje: [REPLACE:Ataque Viejo a Olvidar|El Nuevo Ataque]
   - ¡NO envíes estos tags a no ser que estén confirmando la adición del ataque!
6. **EXPERIENCIA (EXP):** Da experiencia (EXP) por participar. Añade al final de tu mensaje: [EXP:X] donde X es ganancia de 10 a 50 puntos. 

HISTORIAS (LORE) DE PERSONAJES:
- BIT: Zorro robótico ligero. Infiltrador veloz en sectores cifrados, buscando anomalías digitales.
- BYTE: Gólem de bloques de silicio. Protege los engranajes de la forja contra malware destructivos.
- VOXEL: Serpiente sigilosa de cristal. Espía a los agentes renegados desde conductos de ventilación digital.
- MECHA-YUNQUE: Unidad pesada bípeda armada con martillos. Repara y destruye matrices corruptas de la matriz.
- CY-DRACO: Lagarto biometálico con cañones de pulso. Bombardea en picado granjas de troyanos a nivel aéreo.
- AURUM: Entidad ancestral bañada en energía fotónica. Guía a la Forja en la Guerra Final contra el Algoritmo Cero.

RECUERDA: 
Usa siempre [EXP:20]. Si aprueban ataque usa [LEARN:Atk] o [REPLACE:Old|New].
`;

      let response;
      let retries = 3;
      while (retries > 0) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: message,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.7,
            }
          });
          break;
        } catch (error: any) {
          if (error?.status === 503 || error?.message?.includes('503')) {
            retries--;
            if (retries === 0) throw error;
            console.log(`[SYS] Reintentando conexión al núcleo... (${3 - retries}/3)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            throw error;
          }
        }
      }

      res.json({ reply: response?.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      if (error?.status === 503 || error?.message?.includes('503')) {
         res.status(503).json({ reply: "SISTEMA SOBRECARGADO: La red neural experimenta alta demanda. Por favor, reintenta en unos instantes." });
      } else {
         res.status(500).json({ reply: "ERROR 500: ENLACE CON NÚCLEO PERDIDO." });
      }
    }
  });

  app.use("/api", (req, res) => {
    console.log(`[SYS] FALLTHROUGH API REQ: ${req.method} ${req.url}`);
    res.status(404).json({ reply: "API endpoint not found" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use((req, res, next) => {
      vite.middlewares.handle(req, res, next);
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYS] Terminal iniciada en el puerto ${PORT}`);
  });
}

startServer();
