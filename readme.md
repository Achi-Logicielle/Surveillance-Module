**Surveillance Module**
Un module de EMS qui permet de gérer les alertes

Comment ça fonctionne:

Chaque device contient thresholds dans sa configuration (les normes ou bien son état normal) tel que : 
voltage, current, temperature

Chaque device possède aussi telemetries (son état actuel)

Lorsque une alertes est recu alors, une vérification sera faite pour traiter cette alertes, voir son origine et les problèmes liés

**To execute:**
Create .env file : add the MONGODB_URI
run : npm install then npm run dev
