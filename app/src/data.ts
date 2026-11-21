// BARCELONA REAL ESTATE LIFE - Web jugable (prototipo 0.1)
// Contenido del juego: agencias, cursos, dialogos, portales, guia.
// Portales con nombres ficticios (decision de marcas pendiente del usuario).

export interface Agencia {
  id: string;
  nombre: string;
  zona: string;
  descripcion: string;
  comision: string;
  formacion: string;
  ambiente: string;
  sueldo?: string;
  mapa: { x: number; y: number };
}

export const AGENCIAS: Agencia[] = [
  {
    id: 'eixample-habitat',
    nombre: 'Eixample Habitat',
    zona: 'Eixample',
    descripcion: 'Agencia consolidada con cartera amplia de pisos familiares. Método de trabajo ordenado y mentores con mucho oficio.',
    comision: '50% del fee de agencia',
    formacion: 'Plan de mentoría semanal',
    ambiente: 'Profesional y cercano',
    mapa: { x: 70, y: 65 },
  },
  {
    id: 'gracia-living',
    nombre: 'Gràcia Living',
    zona: 'Gràcia',
    descripcion: 'Equipo pequeño y dinámico, especializado en particulares y primeras ventas. Mucha calle y mucho ritmo.',
    comision: '60% del fee de agencia',
    formacion: 'Acompañamiento en visitas reales',
    ambiente: 'Joven y competitivo',
    mapa: { x: 250, y: 65 },
  },
  {
    id: 'diagonal-prime',
    nombre: 'Diagonal Prime',
    zona: 'Les Corts',
    descripcion: 'Inmobiliaria premium de oficinas y vivienda de alto standing. Exigente, pero con las mejores herramientas.',
    comision: '45% del fee de agencia',
    formacion: 'Academia interna con diplomas propios',
    ambiente: 'Exigente y elegante',
    mapa: { x: 340, y: 65 },
  },
  // Ampliación (1.3): agencias del material UE5 de Alejandro (UE5/Data/Agencies.csv),
  // con su comisión por operación y sueldo base mensual.
  {
    id: 'inmobarcelona-centro',
    nombre: 'InmoBarcelona Centro',
    zona: 'Ciutat Vella',
    descripcion: 'Agencia consolidada en el centro histórico. Ideal para empezar.',
    comision: '3% de la operación',
    sueldo: '800 €/mes',
    formacion: 'Mentor asignado desde el primer día',
    ambiente: 'Consolidado y con oficio',
    mapa: { x: 160, y: 65 },
  },
  {
    id: 'eixample-properties',
    nombre: 'Eixample Properties',
    zona: 'Eixample',
    descripcion: 'Especializada en pisos del Eixample. Buen volumen de clientes.',
    comision: '3,5% de la operación',
    sueldo: '900 €/mes',
    formacion: 'Mentor asignado desde el primer día',
    ambiente: 'Mucho volumen y ritmo',
    mapa: { x: 70, y: 225 },
  },
  {
    id: 'gracia-homes',
    nombre: 'Gracia Homes',
    zona: 'Gràcia',
    descripcion: 'Chalets y pisos en Gràcia. Ambiente familiar.',
    comision: '4% de la operación',
    sueldo: '750 €/mes',
    formacion: 'Mentor asignado desde el primer día',
    ambiente: 'Familiar y cercano',
    mapa: { x: 250, y: 225 },
  },
  {
    id: 'costa-barcelona-inmo',
    nombre: 'Costa Barcelona Inmo',
    zona: 'Sant Martí',
    descripcion: 'Viviendas frente al mar. Comisiones altas.',
    comision: '4,5% de la operación',
    sueldo: '1.000 €/mes',
    formacion: 'Mentor asignado desde el primer día',
    ambiente: 'Marítimo y comercial',
    mapa: { x: 310, y: 505 },
  },
  {
    id: 'sarria-elite-realty',
    nombre: 'Sarrià Elite Realty',
    zona: 'Sarrià',
    descripcion: 'Inmuebles de alto standing. Requiere experiencia.',
    comision: '5% de la operación',
    sueldo: '1.200 €/mes',
    formacion: 'Mentor asignado desde el primer día',
    ambiente: 'Premium y exigente',
    mapa: { x: 340, y: 145 },
  },
];

// Diálogo de reclutamiento del material UE5 (UE5/Data/Dialogue_AgencyRecruitment.csv):
// saludo del director, línea de aceptación y primer objetivo con mentor.
export const DIALOGO_ENTREVISTA = {
  saludo: '— Buenos días. Veo que vienes buscando trabajo. Cuéntame, ¿por qué quieres ser agente inmobiliario?',
  aceptacion: 'Me gusta tu actitud. Te doy la bienvenida a nuestro equipo. Cobrarás comisiones por tus operaciones.',
  primerObjetivo: 'Tu primer objetivo: familiarízate con la oficina, el CRM y las herramientas. Te asigno un mentor.',
};

export interface OpcionEntrevista {
  texto: string;
  comentario: string;
}

export interface PreguntaEntrevista {
  texto: string;
  opciones: OpcionEntrevista[];
}

// La contratacion es siempre positiva (decision de diseno del creador),
// pero la impresion que causas en el director depende de tus respuestas.
export const ENTREVISTA: PreguntaEntrevista[] = [
  {
    texto: '¿Por qué quieres trabajar en el sector inmobiliario?',
    opciones: [
      {
        texto: 'Porque me han dicho que en este sector se gana dinero rápido.',
        comentario: 'El director tuerce el gesto: quien solo busca dinero rápido suele durar poco.',
      },
      {
        texto: 'Porque quiero ayudar a la gente en la decisión más importante de su vida.',
        comentario: 'Al director le gusta lo que oye: el oficio empieza por la vocación de servicio.',
      },
      {
        texto: 'Porque necesito encontrar trabajo cuanto antes, sea del sector que sea.',
        comentario: 'El director anota algo: la necesidad es honesta, pero no demuestra interés por el sector.',
      },
      {
        texto: 'Me apasiona el sector inmobiliario y quiero aprender desde cero.',
        comentario: '«Excelente actitud. La motivación es clave.»',
      },
      {
        texto: 'Solo busco un trabajo bien pagado.',
        comentario: '«La motivación económica sola no es suficiente. Los mejores agentes aman su trabajo.»',
      },
    ],
  },
  {
    texto: 'No tienes experiencia. ¿Cómo compensarás eso?',
    opciones: [
      {
        texto: 'Improvisando sobre la marcha: al final todo el mundo aprende así.',
        comentario: 'El director niega con la cabeza: improvisar con la casa de un cliente sale caro.',
      },
      {
        texto: 'Pidiendo que al principio me lo den todo mascado y revisado.',
        comentario: 'El director se remueve: apoyarse está bien, depender de los demás, no.',
      },
      {
        texto: 'Con actitud: formación diaria, escuchar a los mentores y trabajar más que nadie.',
        comentario: 'El director asiente: la experiencia se adquiere; la actitud, no.',
      },
    ],
  },
  {
    texto: 'Un propietario te dice que tu comisión le parece alta. ¿Qué respondes?',
    opciones: [
      {
        texto: 'Le explico con datos todo el trabajo y el valor que recibe a cambio.',
        comentario: 'El director sonríe: defender el precio es defender el trabajo, con datos.',
      },
      {
        texto: 'Le bajo la comisión en el momento para no arriesgar el encargo.',
        comentario: 'El director levanta una ceja: regalar la comisión es regalar tu trabajo.',
      },
      {
        texto: 'Le digo que es la tarifa oficial y que no hay nada que hablar.',
        comentario: 'El director toma aire: cerrar la conversación es cerrar la puerta al encargo.',
      },
    ],
  },
];

export const MEJOR_OPCION_ENTREVISTA = [1, 2, 0];

export interface Curso {
  id: string;
  titulo: string;
  academia: string;
  especialidad: string;
  xp: number;
  diploma: string;
  examen: { pregunta: string; opciones: string[]; correcta: number; explicacion: string }[];
}

export const CURSOS: Curso[] = [
  {
    id: 'fundamentos',
    titulo: 'Fundamentos del asesor inmobiliario',
    academia: 'Academia Immobiliaria BCN',
    especialidad: 'Fundamentos',
    xp: 80,
    diploma: 'Diploma en Fundamentos Inmobiliarios',
    examen: [
      {
        pregunta: '¿Cuál es el primer paso profesional con un propietario particular?',
        opciones: [
          'Enviarle el contrato de exclusiva para que lo revise esta misma semana',
          'Escuchar su situación y cualificar el motivo real de la venta',
          'Pedirle las llaves y hacer fotos para empezar a anunciarlo ya',
        ],
        correcta: 1,
        explicacion: 'Antes de proponer nada hay que entender el motivo de venta: sin cualificar no hay servicio profesional.',
      },
      {
        pregunta: '¿Qué es una nota simple registral?',
        opciones: [
          'Un documento que acredita la titularidad y las cargas de un inmueble',
          'Un justificante del IBI que prueba que el impuesto está pagado al día',
          'Una nota del administrador de fincas sobre el estado de la comunidad',
        ],
        correcta: 0,
        explicacion: 'La nota simple del Registro de la Propiedad muestra titularidad y cargas: es básica antes de comercializar.',
      },
      {
        pregunta: '¿Qué documento es obligatorio para vender una vivienda en Cataluña desde 2013?',
        opciones: [
          'El contrato de arras firmado por ambas partes ante notario',
          'La licencia de obras de la última reforma integral de la vivienda',
          'El certificado de eficiencia energética de la vivienda (CEE)',
        ],
        correcta: 2,
        explicacion: 'El certificado de eficiencia energética es obligatorio para anunciar y vender.',
      },
    ],
  },
  {
    id: 'captacion',
    titulo: 'Captacion de particulares',
    academia: 'Academia Immobiliaria BCN',
    especialidad: 'Captacion',
    xp: 100,
    diploma: 'Diploma en Captacion',
    examen: [
      {
        pregunta: 'Un anuncio de particular lleva 6 semanas publicado con bajada de precio. ¿Qué oportunidad ves?',
        opciones: [
          'Ninguna: si no se ha vendido ya, es que el piso tiene algún problema serio',
          'Un propietario con necesidad creciente que puede valorar ayuda profesional',
          'Que el portal funciona mal y conviene avisarle para que cambie el anuncio cuanto antes',
        ],
        correcta: 1,
        explicacion: 'El tiempo en mercado y las bajadas senalan dolor: es el mejor momento para aportar valor, no para presionar.',
      },
      {
        pregunta: '¿Cuál es la mejor primera frase en una llamada de captación?',
        opciones: [
          'Le llamo porque en mi agencia somos los que más vendemos de toda la zona',
          '¿Sigue vendiendo? Le quito el piso de las manos en menos de un mes',
          'He visto su anuncio y creo saber por qué no le están llegando ofertas',
        ],
        correcta: 2,
        explicacion: 'Aportar un diagnóstico útil en la primera frase abre conversación; vender la agencia de entrada la cierra.',
      },
      {
        pregunta: '¿Qué es una exclusiva inmobiliaria?',
        opciones: [
          'Un piso que la agencia enseña solo a sus mejores clientes VIP',
          'Un encargo de venta en solitario a una agencia por un tiempo',
          'Un tipo de comisión más alta que la habitual por la venta',
        ],
        correcta: 1,
        explicacion: 'La exclusiva es un encargo en solitario a cambio de un plan de comercialización profesional.',
      },
    ],
  },
  {
    id: 'negociacion',
    titulo: 'Negociacion y cierre',
    academia: 'Instituto de Ventas Diagonal',
    especialidad: 'Negociacion',
    xp: 120,
    diploma: 'Diploma en Negociacion',
    examen: [
      {
        pregunta: 'El comprador ofrece un 15% menos del precio. ¿Qué haces primero?',
        opciones: [
          'Transmitirla al propietario y trabajar las posiciones de ambas partes',
          'Rechazarla de inmediato para no hacer perder tiempo al propietario',
          'Aceptarla cuanto antes para asegurar el cierre de la operación este mes',
        ],
        correcta: 0,
        explicacion: 'El agente transmite y trabaja toda oferta: su papel es acercar posiciones, no decidir por el propietario.',
      },
      {
        pregunta: '¿Qué es una señal o arras?',
        opciones: [
          'Una multa que se paga por cancelar una visita concertada con el agente',
          'El impuesto de transmisiones que paga el comprador al firmar la escritura',
          'Una entrega a cuenta que formaliza el compromiso de compraventa',
        ],
        correcta: 2,
        explicacion: 'Las arras formalizan el compromiso y regulan las consecuencias del desistimiento.',
      },
      {
        pregunta: '¿Cuál es el mejor momento para pedir referencias a un cliente satisfecho?',
        opciones: [
          'Un año después de la venta, por correo y con un detalle de la agencia',
          'Justo después de la firma, con la satisfacción del cierre reciente',
          'Nunca: pedirlas transmite una imagen poco profesional del asesor',
        ],
        correcta: 1,
        explicacion: 'La recomendación se pide en el momento de máxima satisfacción: al cerrar con éxito.',
      },
    ],
  },
  {
    id: 'valoracion-avanzada',
    titulo: 'Valoracion avanzada de vivienda',
    academia: 'Academia Immobiliaria BCN',
    especialidad: 'Valoracion',
    xp: 140,
    diploma: 'Diploma en Valoracion Avanzada',
    examen: [
      {
        pregunta: '¿Cuál es el método más fiable para valorar una vivienda habitual?',
        opciones: [
          'El precio medio de los anuncios que el propietario ha visto en portales',
          'Testigos de venta reales comparables, homogeneizados por superficie y estado',
          'El valor catastral actualizado con el último tipo impositivo',
        ],
        correcta: 1,
        explicacion: 'Los testigos de venta reales (no anuncios) homogeneizados son la base de una valoración defendible.',
      },
      {
        pregunta: '¿Qué es homogeneizar testigos de venta?',
        opciones: [
          'Ajustar los precios de los comparables para hacerlos comparables entre sí: superficie, planta, estado, terraza',
          'Usar solo los testigos que confirman el precio que el propietario espera',
          'Aplicar el mismo coeficiente corrector a todos los pisos del distrito',
        ],
        correcta: 0,
        explicacion: 'Homogeneizar es corregir las diferencias reales entre testigos y el inmueble a valorar.',
      },
      {
        pregunta: 'Un propietario quiere salir a un 25% sobre mercado. ¿Qué haces?',
        opciones: [
          'Aceptar el precio y esperar a que el mercado suba hasta él',
          'Rechazar el encargo de inmediato: no se trabaja con ese propietario',
          'Mostrarle los testigos y acordar un precio de salida con margen razonable y plan de revisión',
        ],
        correcta: 2,
        explicacion: 'Se gestiona con datos: precio defendible, margen pactado y revisión con plazos.',
      },
    ],
  },
  {
    id: 'marketing',
    titulo: 'Marketing inmobiliario',
    academia: 'Instituto de Ventas Diagonal',
    especialidad: 'Marketing',
    xp: 160,
    diploma: 'Diploma en Marketing Inmobiliario',
    examen: [
      {
        pregunta: '¿Qué es lo primero que hace vender un anuncio en un portal?',
        opciones: [
          'Un título largo con todas las características del inmueble',
          'Fotografías profesionales, luz y el orden correcto de las imágenes',
          'Publicar el mismo anuncio repetido cada semana para ganar visibilidad',
        ],
        correcta: 1,
        explicacion: 'Las fotos son la primera criba: sin buenas imágenes no hay clics, y sin clics no hay visitas.',
      },
      {
        pregunta: '¿En qué consiste el home staging?',
        opciones: [
          'Preparar y presentar la vivienda para que el visitante se imagine viviendo en ella',
          'Reformar la vivienda por completo antes de ponerla a la venta',
          'Alquilar muebles de lujo para justificar un precio más alto',
        ],
        correcta: 0,
        explicacion: 'El home staging prepara la vivienda para la venta: orden, luz, despersonalización y pequeños arreglos.',
      },
      {
        pregunta: '¿Cuál es un plan de difusión profesional de un encargo?',
        opciones: [
          'Portales, cartel en el balcón, escaparate, base de datos de compradores y comercio local',
          'Publicarlo en un único portal con la máxima difusión contratada',
          'Compartir el anuncio en las redes personales del agente',
        ],
        correcta: 0,
        explicacion: 'La difusión profesional combina canales: online, físico, base de datos y la red del barrio.',
      },
    ],
  },
  {
    id: 'fiscalidad',
    titulo: 'Fiscalidad de la compraventa',
    academia: 'Academia Immobiliaria BCN',
    especialidad: 'Fiscalidad',
    xp: 180,
    diploma: 'Diploma en Fiscalidad Inmobiliaria',
    examen: [
      {
        pregunta: '¿Qué impuesto paga el comprador de una vivienda de segunda mano en Cataluña?',
        opciones: [
          'El IVA al tipo reducido de vivienda',
          'El Impuesto de Transmisiones Patrimoniales (ITP)',
          'La plusvalía municipal sobre el terreno',
        ],
        correcta: 1,
        explicacion: 'En segunda mano el comprador paga ITP; la plusvalía municipal corresponde al vendedor.',
      },
      {
        pregunta: '¿Qué tributa el vendedor en su IRPF tras la venta?',
        opciones: [
          'La ganancia patrimonial: diferencia entre valor de venta y valor de adquisición',
          'El importe total cobrado por la venta como si fuera un sueldo',
          'Solo la parte del precio que supere el valor catastral',
        ],
        correcta: 0,
        explicacion: 'El vendedor declara la ganancia patrimonial, con exenciones en casos como la reinversión en vivienda habitual.',
      },
      {
        pregunta: '¿Por qué conviene anticipar la fiscalidad antes de firmar las arras?',
        opciones: [
          'Porque los impuestos se pagan solo si se firman arras con penalización',
          'Porque el notario no permite escriturar sin liquidar antes todos los impuestos',
          'Porque conocer los costes reales evita sorpresas y permite planear la operación neta',
        ],
        correcta: 2,
        explicacion: 'Un asesor profesional cuenta los costes e impuestos antes de comprometer la operación.',
      },
    ],
  },
];

// Portales ficticios propios de la version web (ver auditoria: marcas reales solo con permiso escrito).
export const PORTALES = ['IdealCasa', 'FotoHogar', 'Habitaclix', 'YaEncontrado'];

export interface DialogoOpcion {
  texto: string;
  siguiente: number; // -1 = terminar
  confianza?: number;
  interes?: number;
  satisfaccion?: number;
  feedback?: string;
  cita?: boolean;
  cierre?: boolean;
}

export interface DialogoNodo {
  npc: string;
  opciones: DialogoOpcion[];
}

// Conversacion con el primer propietario (mision de captacion).
export const CONV_PROPIETARIO: DialogoNodo[] = [
  {
    npc: 'Hola... Si vende usted algo, se lo digo ya: no pienso pagar a ninguna inmobiliaria.',
    opciones: [
      {
        texto: 'Las inmobiliarias cobramos porque lo valemos, se lo aseguro.',
        siguiente: 2,
        confianza: -10,
        interes: -5,
        feedback: 'Demasiado pronto para defender comisiones. Primero escucha.',
      },
      {
        texto: 'No le vendo nada, don Manuel. Creo saber por qué no le llaman compradores. ¿Me da dos minutos?',
        siguiente: 1,
        confianza: 15,
        interes: 10,
        feedback: 'Perfecto: diagnostico antes que venta. Asi se abre una puerta.',
      },
      {
        texto: 'Pues entonces seguro que vende rapidísimo. ¡Suerte!',
        siguiente: -1,
        confianza: -15,
        interes: -20,
        feedback: 'Te has rendido al primer no. Un agente trabaja el segundo intento.',
      },
    ],
  },
  {
    npc: 'Vaya... nadie me lo habia dicho asi. ¿Y por qué no me llaman, según usted?',
    opciones: [
      {
        texto: 'El precio esta un 8% por encima del mercado y las fotos no hacen justicia al piso. Puedo ensenarselo con datos.',
        siguiente: 3,
        confianza: 15,
        interes: 15,
        feedback: 'Datos concretos: precio y presentacion. El propietario ya quiere saber mas.',
      },
      {
        texto: 'Es que el piso esta viejo, con buena presentacion se vende todo.',
        siguiente: 2,
        confianza: -5,
        interes: -5,
        feedback: 'Cuidado con criticar la vivienda: es su casa, no un producto.',
      },
    ],
  },
  {
    npc: 'No me gusta su tono. Creo que esto no va a ninguna parte.',
    opciones: [
      {
        texto: 'Como quiera. Ya me llamará cuando se canse de esperar.',
        siguiente: -1,
        confianza: -10,
        interes: -10,
        feedback: 'La soberbia cierra puertas que tardaban meses en abrirse.',
      },
      {
        texto: 'Tiene razon, disculpe. Solo quiero ayudarle a vender mejor. ¿Empezamos de nuevo?',
        siguiente: 1,
        confianza: 5,
        interes: 0,
        feedback: 'Reconducir con humildad recupera la conversacion.',
      },
    ],
  },
  {
    npc: 'Con datos, eh... ¿Y que cobra su agencia por ese trabajito?',
    opciones: [
      {
        texto: 'Antes de hablar de números, déjeme enseñarle lo que incluye: valoración, fotos, portales y visitas filtradas. ¿Nos vemos mañana y se lo presento?',
        siguiente: 4,
        confianza: 20,
        interes: 20,
        feedback: 'Cita conseguida aportando valor primero. Manual de estilo.',
      },
      {
        texto: 'Un 5%, es nuestra tarifa en este simulador: tómalo o déjalo.',
        siguiente: 2,
        confianza: -10,
        interes: -10,
        feedback: 'Hablar de dinero antes que de valor adelanta el no.',
      },
    ],
  },
  {
    npc: 'De acuerdo, me ha picado la curiosidad. Mañana por la tarde estoy en casa, traigase esos datos.',
    opciones: [
      {
        texto: 'Ya le escribire, que voy muy liado.',
        siguiente: -1,
        confianza: -5,
        interes: -15,
        feedback: 'Una cita sin hora concreta casi nunca sucede.',
      },
      {
        texto: 'Perfecto, don Manuel. Mañana a las 18:00 con la valoracion preparada. ¡Gracias por su tiempo!',
        siguiente: -1,
        confianza: 15,
        interes: 15,
        feedback: 'Cita cerrada con hora concreta. Ahora a preparar la valoracion.',
        cita: true,
      },
    ],
  },
];

// Conversacion de negociacion con el comprador.
export const CONV_COMPRADOR: DialogoNodo[] = [
  {
    npc: 'El piso me encanta, pero ofrezco 15.000 € menos del precio del anuncio. Es mi techo.',
    opciones: [
      {
        texto: 'Con esa rebaja ni lo intentes, el piso vale lo que pide.',
        siguiente: 2,
        confianza: -15,
        interes: -20,
        feedback: 'Despreciar una oferta es despreciar a un comprador real.',
      },
      {
        texto: 'Entiendo tu posición. Transmitiré tu oferta al propietario con tus puntos fuertes: compra rápida y sin condiciones.',
        siguiente: 1,
        confianza: 15,
        interes: 10,
        feedback: 'Toda oferta se transmite y se trabaja. Buen oficio.',
      },
    ],
  },
  {
    npc: 'Puedo subir 7.500 €, pero necesito la respuesta esta semana.',
    opciones: [
      {
        texto: 'Cierro contigo la contraoferta del propietario en 48 horas y te la traigo por escrito.',
        siguiente: 3,
        confianza: 15,
        interes: 15,
        feedback: 'Compromiso con plazo: la negociación avanza con confianza.',
      },
      {
        texto: 'Sube 15.000 o no hay trato.',
        siguiente: 2,
        confianza: -10,
        interes: -15,
        feedback: 'Los ultimatums sin margen rompen operaciones viables.',
      },
    ],
  },
  {
    npc: 'Entonces nada, seguire mirando otros pisos.',
    opciones: [
      {
        texto: 'Suerte con la búsqueda.',
        siguiente: -1,
        confianza: -5,
        interes: -10,
        feedback: 'Has dejado escapar al comprador sin explorar el motivo.',
      },
      {
        texto: 'Antes de que te vayas: ¿que te frena mas, el precio o los plazos? Quizas podamos trabajarlo.',
        siguiente: 1,
        confianza: 10,
        interes: 10,
        feedback: 'Preguntar por el verdadero freno reabre la puerta.',
      },
    ],
  },
  {
    npc: 'De acuerdo: si el propietario acepta mi oferta con la entrada a fin de mes, firmo la reserva hoy.',
    opciones: [
      {
        texto: 'La reserva ya la haremos, primero que pague todo.',
        siguiente: 2,
        confianza: -10,
        interes: -10,
        feedback: 'La reserva con arras es precisamente lo que protege la operacion.',
      },
      {
        texto: 'Lo vemos ahora mismo con el propietario. Si encaja, preparamos la reserva con las arras esta misma tarde.',
        siguiente: -1,
        confianza: 20,
        interes: 20,
        feedback: 'Operacion cerrada: oferta, plazos y reserva con arras.',
        cierre: true,
      },
    ],
  },
];

// Segunda operacion: duplex en Sants por recomendacion de don Manuel (variedad de clientes y situaciones).
export const DUPLEX_SANTS = {
  id: 'duplex-sants',
  titulo: 'Dúplex con terraza en venta (herencia)',
  barrio: 'Sants',
  precio: 315000,
  metros: 95,
  habitaciones: 3,
  descripcion: 'Dúplex exterior con terraza de 12 m², tres habitaciones y dos baños. Finca con ascensor a cinco minutos de la estación de Sants. Los hermanos Vidal lo venden tras una herencia.',
};
export const REF_EUROS_M2_SANTS = 3150;
export const PRECIO_PORTAL = 45;
export const GASTO_DIA = 30;

export const CONV_CARMEN: DialogoNodo[] = [
  {
    npc: 'Pase, pase. Mi hermano y yo heredamos este dúplex y necesitamos venderlo, pero no nos ponemos de acuerdo ni en el precio ni en los plazos.',
    opciones: [
      {
        texto: 'El precio lo manda el mercado, no ustedes. Déjenlo en mis manos y despreocúpense.',
        siguiente: 2,
        confianza: -10,
        interes: -5,
        feedback: 'Válido en el fondo, pero dicho así desautoriza al cliente en su propia casa.',
      },
      {
        texto: 'Entiendo la situación. Antes de hablar de precio, déjeme ver el dúplex y entender qué necesita cada uno de ustedes.',
        siguiente: 1,
        confianza: 15,
        interes: 10,
        feedback: 'Primero las personas, después el inmueble: con dos hermanos, entender a ambos es la mitad del trabajo.',
      },
      {
        texto: 'Con herencias de por medio, esto suele acabar en pleito. Les deseo suerte.',
        siguiente: -1,
        confianza: -15,
        interes: -20,
        feedback: 'Descartar una oportunidad real por comodidad no es de este oficio.',
      },
    ],
  },
  {
    npc: 'Mi hermano pide 340.000 € porque "vale eso". Yo prefiero vender ya y repartir. ¿Usted qué cree?',
    opciones: [
      {
        texto: 'Su hermano tiene parte de razón: Sants está fuerte. Pero sin comparables, los dos están opinando a ciegas.',
        siguiente: 2,
        confianza: 5,
        interes: 0,
        feedback: 'Medias verdades sin datos no resuelven una mesa de dos hermanos.',
      },
      {
        texto: 'Yo me decanto por vender rápido: bajemos el precio y en un mes está hecho.',
        siguiente: 2,
        confianza: -5,
        interes: -10,
        feedback: 'Regalar dinero del cliente para cerrar rápido se nota, y se recuerda.',
      },
      {
        texto: 'Preparo una valoración con testigos reales de Sants y se la explico a los dos juntos: que decidan los datos, no el que más grita.',
        siguiente: 3,
        confianza: 15,
        interes: 15,
        feedback: 'Exacto: datos sobre la mesa y los dos hermanos escuchando lo mismo.',
      },
    ],
  },
  {
    npc: 'No me acaba de convencer su planteamiento. Quizá deberíamos hablar con otra agencia.',
    opciones: [
      {
        texto: 'Discúlpeme, he ido demasiado directo. Vayamos a lo práctico: déjeme prepararle una valoración sin compromiso y decide después con datos.',
        siguiente: 1,
        confianza: 5,
        interes: 0,
        feedback: 'Reconducir sin perder la dignidad: bien recuperado.',
      },
      {
        texto: 'Como prefiera. Cualquier otra agencia le dirá lo mismo del precio.',
        siguiente: -1,
        confianza: -10,
        interes: -10,
        feedback: 'Salir con un reproche cierra la puerta del todo.',
      },
    ],
  },
  {
    npc: 'De acuerdo, tráiganos esa valoración. ¿Y qué cobran ustedes por todo esto?',
    opciones: [
      {
        texto: 'Lo de siempre, ya sabe, lo que se estila en el barrio.',
        siguiente: 2,
        confianza: -10,
        interes: -5,
        feedback: 'En una herencia, lo ambiguo genera desconfianza inmediata.',
      },
      {
        texto: 'En este simulador, los honorarios son el 5% sobre el precio final y solo a éxito: si el dúplex no se vende, no cobro. Se lo detallo por escrito junto a la valoración.',
        siguiente: 4,
        confianza: 20,
        interes: 20,
        feedback: 'Condiciones claras y a éxito: justo lo que una herencia necesita oír.',
      },
    ],
  },
  {
    npc: 'Perfecto. ¿Y cuándo puede pasar a medir y verlo todo con calma?',
    opciones: [
      {
        texto: 'Ya le avisaré esta semana, que ando liadísimo con otras ventas.',
        siguiente: -1,
        confianza: -5,
        interes: -15,
        feedback: 'Una herencia con prisa no espera a agentes sin agenda.',
      },
      {
        texto: '¿Le viene bien esta misma tarde? Traigo metro, comparables y la propuesta por escrito para usted y su hermano.',
        siguiente: -1,
        confianza: 15,
        interes: 15,
        cita: true,
        feedback: 'Cita cerrada con plan concreto para los dos hermanos.',
      },
    ],
  },
];

export const CONV_MARC: DialogoNodo[] = [
  {
    npc: 'El dúplex me encaja como inversión, pero le ofrezco 270.000 €. Es un precio serio y pago rápido.',
    opciones: [
      {
        texto: 'Una oferta por debajo del precio anunciado ni la presento: sería ofender a los propietarios.',
        siguiente: -1,
        confianza: -15,
        interes: -10,
        feedback: 'Filtrar ofertas sin transmitirlas ni argumentarlas quema compradores reales.',
      },
      {
        texto: 'Lo transmito a los hermanos con sus puntos fuertes: compra sin condiciones y firma rápida. Y le preparo la rentabilidad de alquiler de la zona para justificar una subida.',
        siguiente: 1,
        confianza: 15,
        interes: 10,
        feedback: 'Toda oferta se transmite con argumentos, y la subida se trabaja con datos.',
      },
    ],
  },
  {
    npc: 'Puedo subir a 285.000 € si me incluyen los muebles del estudio. Pero necesito respuesta esta semana.',
    opciones: [
      {
        texto: 'Los muebles se valoran aparte del inmueble: le traigo contraoferta con inventario en 48 horas. ¿Le cuadra?',
        siguiente: 2,
        confianza: 15,
        interes: 10,
        feedback: 'Separar muebles de inmueble y dar plazo concreto: negociación limpia.',
      },
      {
        texto: 'Trato hecho por 285.000 €, ahora mismo se lo firmo yo.',
        siguiente: -1,
        confianza: -20,
        interes: -25,
        feedback: 'El agente no vende lo que no es suyo: aceptar sin mandato rompe la operación.',
      },
    ],
  },
  {
    npc: 'Entonces lo vamos dejando. Seguiré mirando en Hospitalet, que hay cosas más baratas.',
    opciones: [
      {
        texto: 'Perfecto, ahí tiene la puerta.',
        siguiente: -1,
        confianza: -20,
        interes: -25,
        feedback: 'Echar a un comprador con 285.000 € sobre la mesa es regalar la operación.',
      },
      {
        texto: 'Antes de que decida: ¿le frena el precio o la operación en sí? Quizá haya margen en los plazos o las condiciones.',
        siguiente: 3,
        confianza: 15,
        interes: 10,
        feedback: 'Diagnosticar el freno real antes de soltar al comprador: así se rescata una visita.',
      },
    ],
  },
  {
    npc: 'Mire, última palabra: 292.000 €, arras del 10% esta semana y escritura en 30 días. ¿Lo movemos?',
    opciones: [
      {
        texto: 'Escriba primero un correo a la agencia y ya veremos qué dicen.',
        siguiente: -1,
        confianza: -10,
        interes: -10,
        feedback: 'Enfriar al comprador en su punto álgido cuesta operaciones.',
      },
      {
        texto: 'Lo hablo hoy mismo con las propietarias. Si encaja, preparamos la reserva con las arras esta semana y le envío el calendario de firma.',
        siguiente: -1,
        confianza: 15,
        interes: 15,
        cierre: true,
        feedback: 'Cierre con próximos pasos concretos y plazos: así se cierra una venta.',
      },
    ],
  },
];

// Guia del agente (roadmap visible en el portatil y la pizarra).
export const GUIA_AGENTE = [
  { id: 'agencia', texto: 'Consigue tu primer puesto en una agencia' },
  { id: 'propietario', texto: 'Encuentra tu primer propietario particular' },
  { id: 'cualificar', texto: 'Cualifica su situacion con una conversacion' },
  { id: 'cita', texto: 'Concierta una cita de valoracion' },
  { id: 'valoracion', texto: 'Realiza la visita y la valoracion' },
  { id: 'propuesta', texto: 'Presenta tu propuesta y consigue el encargo' },
  { id: 'anuncio', texto: 'Prepara el anuncio profesional' },
  { id: 'publicar', texto: 'Publica el anuncio en portales' },
  { id: 'comprador', texto: 'Atiende a los compradores interesados' },
  { id: 'negociar', texto: 'Negocia la oferta y cierra la venta' },
  { id: 'formacion', texto: 'Supera tu primera formacion y diploma' },
  { id: 'sants-cita', texto: 'Consigue la valoración del dúplex de Sants' },
  { id: 'sants-valoracion', texto: 'Valora el dúplex con datos de la zona' },
  { id: 'sants-encargo', texto: 'Firma el encargo del dúplex' },
  { id: 'sants-publicado', texto: 'Publica el anuncio del dúplex' },
  { id: 'sants-venta', texto: 'Cierra tu segunda venta' },
  { id: 'gracia-cita', texto: 'Consigue la valoración del ático de Gràcia' },
  { id: 'gracia-valoracion', texto: 'Valora el ático con datos de la Vila' },
  { id: 'gracia-encargo', texto: 'Firma el encargo del ático' },
  { id: 'gracia-publicado', texto: 'Publica el anuncio del ático' },
  { id: 'gracia-venta', texto: 'Cierra tu tercera venta' },
];

// 1.5 · Progresión gradual: además de XP y diplomas, cada rango exige operaciones cerradas
// y días de carrera, para que el máximo no se alcance en pocos días.
export const RANGOS = [
  { nombre: 'Aprendiz', xp: 0, diplomas: 0, ventas: 0, dia: 1 },
  { nombre: 'Agente Junior', xp: 150, diplomas: 0, ventas: 0, dia: 2 },
  { nombre: 'Agente Inmobiliario', xp: 500, diplomas: 1, ventas: 1, dia: 4 },
  { nombre: 'Agente Especialista', xp: 1300, diplomas: 2, ventas: 2, dia: 7 },
  { nombre: 'Asesor Inmobiliario Senior', xp: 2600, diplomas: 3, ventas: 3, dia: 11 },
];

// 1.5 · Cartera compartida: propiedades de otras agencias (no la tuya) que aparecen en el portátil.
// Colaborar da XP, reputación y una parte simbólica de la comisión (datos ficticios).
export type TipoColab = 'comprador' | 'visita' | 'valoracion';
export interface Colaboracion { id: string; agenciaId: string; titulo: string; barrio: string; precio: number; tipo: TipoColab; }
export const COLABORACIONES: Colaboracion[] = [
  { id: 'c-ib-1', agenciaId: 'inmobarcelona-centro', titulo: 'Piso reformado junto a la Catedral', barrio: 'Ciutat Vella', precio: 395000, tipo: 'comprador' },
  { id: 'c-ib-2', agenciaId: 'inmobarcelona-centro', titulo: 'Loft con vigas en El Born', barrio: 'Ciutat Vella', precio: 340000, tipo: 'visita' },
  { id: 'c-ep-1', agenciaId: 'eixample-properties', titulo: 'Piso modernista con galería', barrio: 'Eixample', precio: 520000, tipo: 'valoracion' },
  { id: 'c-ep-2', agenciaId: 'eixample-properties', titulo: 'Tres habitaciones cerca de Passeig de Sant Joan', barrio: 'Eixample', precio: 455000, tipo: 'comprador' },
  { id: 'c-gh-1', agenciaId: 'gracia-homes', titulo: 'Casa con patio en la Vila', barrio: 'Gràcia', precio: 610000, tipo: 'visita' },
  { id: 'c-gh-2', agenciaId: 'gracia-homes', titulo: 'Dúplex con terraza', barrio: 'Gràcia', precio: 385000, tipo: 'valoracion' },
  { id: 'c-cb-1', agenciaId: 'costa-barcelona-inmo', titulo: 'Piso con vistas al mar', barrio: 'Sant Martí', precio: 470000, tipo: 'comprador' },
  { id: 'c-cb-2', agenciaId: 'costa-barcelona-inmo', titulo: 'Estudio cerca de la playa', barrio: 'Sant Martí', precio: 245000, tipo: 'visita' },
  { id: 'c-se-1', agenciaId: 'sarria-elite-realty', titulo: 'Villa con jardín y piscina', barrio: 'Sarrià', precio: 1450000, tipo: 'valoracion' },
  { id: 'c-se-2', agenciaId: 'sarria-elite-realty', titulo: 'Ático señorial con ascensor privado', barrio: 'Sarrià', precio: 890000, tipo: 'comprador' },
  { id: 'c-eh-1', agenciaId: 'eixample-habitat', titulo: 'Finca regia con techos altos', barrio: 'Eixample', precio: 575000, tipo: 'visita' },
  { id: 'c-eh-2', agenciaId: 'eixample-habitat', titulo: 'Piso exterior para reformar', barrio: 'Eixample', precio: 310000, tipo: 'valoracion' },
  { id: 'c-gl-1', agenciaId: 'gracia-living', titulo: 'Piso luminoso junto a plaza del Sol', barrio: 'Gràcia', precio: 360000, tipo: 'comprador' },
  { id: 'c-gl-2', agenciaId: 'gracia-living', titulo: 'Planta baja con patio', barrio: 'Gràcia', precio: 295000, tipo: 'visita' },
  { id: 'c-dp-1', agenciaId: 'diagonal-prime', titulo: 'Piso de lujo en la Diagonal', barrio: 'Les Corts', precio: 780000, tipo: 'valoracion' },
  { id: 'c-dp-2', agenciaId: 'diagonal-prime', titulo: 'Oficina convertida en vivienda', barrio: 'Les Corts', precio: 430000, tipo: 'comprador' },
];
export const MAX_COLABS_DIA = 2;
// Parámetros del simulador. Los % por aportación del asesor son los de VENDOPOR (ver comisiones.ts);
// lo siguiente son supuestos de demostración, no condiciones reales de VENDOPOR.
export const HONORARIOS_PCT = 0.05;         // honorarios sobre el precio: 15.000 € en una venta de 300.000 € (mínimo indicado por VENDOPOR), proporcional en otros precios
export const REPARTO_AGENCIA_CAPTADORA = 0.6;  // indicado por Alejandro (21 nov, WhatsApp): 60% de los honorarios para la agencia captadora
export const REPARTO_AGENCIA_VENDEDORA = 0.4;  // y 40% para la agencia que vende
export const DIAS_HASTA_COBRO = 3;          // días entre la reserva y la escritura/cobro (plazo de demostración)
export const AVISO_MODELO = 'Porcentajes por aportación: los del vídeo y el informe de condiciones VENDOPOR 2026-2027 (captación hasta 35%, comprador hasta 45%; comisión que se devenga cuando VENDOPOR cobra). Reparto entre agencias: 40% la que vende y 60% la captadora (indicado por Alejandro). Honorarios del 5% y plazo de cobro de 3 días son supuestos de demostración, no condiciones reales.';
export const AVISO_NETO = 'Importe bruto de comisión. No es beneficio neto: no se simulan IVA, IRPF, cuota de autónomos, seguros ni gastos propios.';
export const COLAB_ESCENAS: Record<TipoColab, { titulo: string; pregunta: string; opciones: { texto: string; calidad: 2 | 1 | 0; feedback: string }[] }> = {
  comprador: {
    titulo: 'Aportar un comprador',
    pregunta: 'Tienes en el CRM a un comprador que podría encajar. ¿Cómo se lo presentas a la otra agencia?',
    opciones: [
      { texto: 'Les paso su perfil real (presupuesto, plazos, financiación) y acordamos cómo repartir la comisión por escrito', calidad: 2, feedback: 'Colaboración limpia: datos claros y reparto pactado antes de enseñar nada.' },
      { texto: 'Les digo que tengo un comprador, sin más detalles, y ya veremos', calidad: 1, feedback: 'Funciona, pero sin datos ni reparto pactado la otra agencia duda.' },
      { texto: 'Enseño el piso a mi comprador por mi cuenta, sin avisar', calidad: 0, feedback: 'Saltarte a la agencia propietaria rompe la confianza y no cuenta como colaboración.' },
    ],
  },
  visita: {
    titulo: 'Acompañar una visita',
    pregunta: 'La otra agencia necesita apoyo en una visita con varias parejas interesadas. ¿Qué haces?',
    opciones: [
      { texto: 'Llego antes, preparo la vivienda, atiendo a las parejas y paso al compañero un resumen de cada una', calidad: 2, feedback: 'Aportas orden y datos: así se gana la próxima colaboración.' },
      { texto: 'Acudo y respondo lo que me preguntan', calidad: 1, feedback: 'Cumples, pero aportas poco más que presencia.' },
      { texto: 'Aprovecho para ofrecerles mis propios pisos', calidad: 0, feedback: 'Captar clientes de otro en su visita es mala praxis y te cierra puertas.' },
    ],
  },
  valoracion: {
    titulo: 'Segunda opinión de precio',
    pregunta: 'Te piden una segunda opinión sobre el precio de salida. ¿Cómo la das?',
    opciones: [
      { texto: 'Comparo con ventas reales de la zona, razono una horquilla y explico qué la subiría o bajaría', calidad: 2, feedback: 'Una valoración razonada con datos reales es lo que más valora un colega.' },
      { texto: 'Digo un precio por intuición', calidad: 1, feedback: 'Puede acertar, pero sin datos nadie lo puede defender ante el propietario.' },
      { texto: 'Les recomiendo subir mucho el precio para mejorar la comisión', calidad: 0, feedback: 'Inflar el precio hunde la venta y tu credibilidad.' },
    ],
  },
};



export const ATICO_GRACIA = {
  id: 'atico-gracia',
  titulo: 'Ático con vistas en venta (mudanza)',
  barrio: 'Gràcia',
  precio: 280000,
  metros: 68,
  habitaciones: 2,
  descripcion: 'Ático exterior de 68 m² con terraza de 18 m² y vistas abiertas sobre los tejados de la Vila de Gràcia. Dos habitaciones, cocina abierta y trastero. Núria lo vende porque se muda a Sitges con su pareja.',
};
export const REF_EUROS_M2_GRACIA = 4050;

// Conversacion con la tercera propietaria (mudanza a Sitges, llega por recomendacion de Sants).
export const CONV_NURIA: DialogoNodo[] = [
  {
    npc: 'Hola, soy Núria. Me hablaron de ti en Sants, del buen trato con los hermanos Vidal. Vendo mi ático de Gràcia porque me mudo a Sitges con mi pareja, pero no me corre prisa y no pienso regalarlo.',
    opciones: [
      {
        texto: 'Enhorabuena por el cambio. Antes de números: ¿qué es lo más importante para ti en esta venta?',
        siguiente: 1,
        confianza: 15,
        interes: 10,
        feedback: 'Primero las personas: entender qué necesita la propietaria marca todo el encargo.',
      },
      {
        texto: 'Perfecto, ¿cuánto quieres sacar? Mándame fotos y lo publico esta misma semana.',
        siguiente: 2,
        confianza: -10,
        interes: -5,
        feedback: 'Correr antes de escuchar convierte un ático único en un anuncio más.',
      },
      {
        texto: 'Si no te corre prisa, igual es mejor esperar a que el mercado suba.',
        siguiente: 3,
        confianza: -10,
        interes: -15,
        feedback: 'Disuadir a una propietaria decidida te deja fuera de la operación.',
      },
    ],
  },
  {
    npc: 'Lo más importante: comprador serio y cero visitas de curiosos. Ya pasé por eso con otro piso y fue agotador.',
    opciones: [
      {
        texto: 'Entonces visitas filtradas: solo compradores con financiación ya estudiada. ¿Te viene bien si paso esta tarde a valorar el ático?',
        siguiente: -1,
        confianza: 15,
        interes: 10,
        feedback: 'Propuesta concreta que responde a su miedo exacto, y cita encima de la mesa.',
        cita: true,
      },
      {
        texto: 'Las visitas masivas dan más opciones de venta: cuanta más gente entre, antes se vende.',
        siguiente: 4,
        confianza: -10,
        interes: -5,
        feedback: 'Le acabas de prometer justo lo que te ha dicho que no quiere.',
      },
      {
        texto: 'Entendido. Te preparo un plan por escrito y hablamos la semana que viene.',
        siguiente: 4,
        confianza: 0,
        interes: -10,
        feedback: 'Sin fecha concreta, el plan por escrito se enfría en un cajón.',
      },
    ],
  },
  {
    npc: 'Un momento, vas muy rápido. Las fotos las tengo, pero antes quiero saber cómo trabajas tú.',
    opciones: [
      {
        texto: 'Tienes razón, primero escuchar. ¿Qué es lo que más te preocupa del proceso?',
        siguiente: 1,
        confianza: 10,
        interes: 5,
        feedback: 'Rectificar a tiempo y volver a escuchar recupera la conversación.',
      },
      {
        texto: 'Trabajo como todas las agencias: anuncio, visitas y ofertas.',
        siguiente: 4,
        confianza: -10,
        interes: -10,
        feedback: '"Como todas las agencias" es la forma más rápida de ser una más.',
      },
      {
        texto: 'Si lo dudas, quizá no es tu momento de vender.',
        siguiente: 4,
        confianza: -15,
        interes: -15,
        feedback: 'Presionar con la duda cierra puertas que estaban abiertas.',
      },
    ],
  },
  {
    npc: '¿Esperar? Mi pareja ya está en Sitges y yo haciendo viajes cada semana. Tampoco es eso, quiero cerrarlo bien y ya.',
    opciones: [
      {
        texto: 'Perdona, me he adelantado. Entonces lo importante es vender bien sin quitarte más viajes: yo me encargo de todo aquí. ¿Qué más necesitas?',
        siguiente: 1,
        confianza: 10,
        interes: 5,
        feedback: 'Reconocer el error y ofrecer quitarle carga: así se vuelve al camino.',
      },
      {
        texto: 'Entonces baja el precio un 10% y lo tienes vendido en un mes.',
        siguiente: 4,
        confianza: -15,
        interes: -10,
        feedback: 'Regalar el dinero de la clienta para ir rápido se nota, y se recuerda.',
      },
      {
        texto: 'Ya me dirás. Aquí tienes mi tarjeta.',
        siguiente: 4,
        confianza: -5,
        interes: -15,
        feedback: 'Entregar una tarjeta y marcharse no es captar: es despedirse.',
      },
    ],
  },
  {
    npc: 'Mira, déjame que lo piense y ya te llamaré.',
    opciones: [
      {
        texto: 'Perfecto, te escribo esta tarde con un resumen de lo hablado y quedo a tu disposición.',
        siguiente: -1,
        confianza: 5,
        interes: 0,
        feedback: 'Cierre amable con seguimiento concreto: la puerta queda entreabierta.',
      },
      {
        texto: 'De acuerdo, ya me llamarás.',
        siguiente: -1,
        confianza: 0,
        interes: -5,
        feedback: 'Sin siguiente paso acordado, "ya te llamaré" suele ser un no.',
      },
      {
        texto: 'Piénsalo bien: áticos así no salen todos los días.',
        siguiente: -1,
        confianza: -10,
        interes: -10,
        feedback: 'La presión final deshace lo bien hecho antes.',
      },
    ],
  },
];

// Conversacion con los compradores del atico (primera vivienda en pareja).
export const CONV_JORDI: DialogoNodo[] = [
  {
    npc: 'Hola, somos Jordi y Laia. El ático nos encanta, la terraza es justo lo que buscábamos, pero {precioAnuncio} se nos va de presupuesto. ¿Hay margen?',
    opciones: [
      {
        texto: 'Me alegro de que os encaje. Hablemos de números: ¿qué presupuesto máximo os aprueba el banco?',
        siguiente: 1,
        confianza: 15,
        interes: 10,
        feedback: 'Preguntar por la capacidad real, no regatear a ciegas: negociación con datos.',
      },
      {
        texto: 'El precio es {precioAnuncio} y hay más gente interesada, pensáoslo rápido.',
        siguiente: 2,
        confianza: -10,
        interes: -5,
        feedback: 'La presión con compradores emocionados quema la mejor oferta que tenías.',
      },
      {
        texto: 'Puedo hablarlo con la propietaria, pero solo le llevo ofertas serias por escrito.',
        siguiente: 1,
        confianza: 5,
        interes: 5,
        feedback: 'Filtrar con profesionalidad sin cerrar la puerta.',
      },
    ],
  },
  {
    npc: 'El banco nos aprueba 265.000 €, y con los ahorros que teníamos para la entrada podemos llegar a 272.000 €, siempre que entren el trastero y los muebles de la terraza. ¿Lo ves posible?',
    opciones: [
      {
        texto: 'Propongo esto: 272.000 € con trastero y muebles de terraza incluidos. Se lo defiendo a la propietaria como cierre rápido y seguro. ¿Os lo preparo por escrito?',
        siguiente: 3,
        confianza: 15,
        interes: 15,
        feedback: 'Sumar valor real (trastero, muebles) en lugar de solo bajar precio: así se acercan las partes.',
      },
      {
        texto: 'Con 265.000 € no puedo ni llevárselo a la propietaria.',
        siguiente: 3,
        confianza: -10,
        interes: -10,
        feedback: 'Toda oferta se transmite: decidir por la propietaria sin consultarla es pasarte de tu papel.',
      },
      {
        texto: 'Buscad más financiación con la familia y volvemos a hablar.',
        siguiente: 2,
        confianza: -5,
        interes: -10,
        feedback: 'Mandar a buscar dinero sin trabajar la operación enfría a los compradores.',
      },
    ],
  },
  {
    npc: 'No nos presiones, por favor. Si no hay margen, seguiremos mirando por la Vila, que algo saldrá.',
    opciones: [
      {
        texto: 'Perdonad, no era mi intención. Quiero que os quedéis este ático: contadme qué os encajaría de verdad.',
        siguiente: 1,
        confianza: 10,
        interes: 5,
        feedback: 'Bajar la tensión y volver a sus necesidades reabre la negociación.',
      },
      {
        texto: 'Es mi trabajo conseguir el mejor precio para mi clienta.',
        siguiente: 3,
        confianza: -5,
        interes: -10,
        feedback: 'Cierto, pero dicho así suena a adversario, no a profesional que acerca posiciones.',
      },
      {
        texto: 'Suerte con la búsqueda, ya me diréis.',
        siguiente: -1,
        confianza: -10,
        interes: -15,
        feedback: 'Soltar a unos compradores cualificados por orgullo es perder la venta dos veces.',
      },
    ],
  },
  {
    npc: 'Nos gusta la idea del trastero y la terraza amueblada... Danos un momento, que lo hablemos despacio.',
    opciones: [
      {
        texto: '272.000 € con trastero y muebles de terraza, arras esta semana. Es un ático que no vuelve: ¿firmamos la reserva?',
        siguiente: -1,
        confianza: 15,
        interes: 15,
        feedback: 'Cierre con condiciones claras y un motivo real para decidir hoy.',
        cierre: true,
      },
      {
        texto: 'Pensadlo con calma y me llamáis mañana sin compromiso.',
        siguiente: -1,
        confianza: 5,
        interes: -10,
        feedback: 'Sin fecha ni siguiente paso, "mañana" puede no llegar nunca.',
      },
      {
        texto: 'Si dudáis tanto, igual no es vuestro piso.',
        siguiente: -1,
        confianza: -15,
        interes: -20,
        feedback: 'Desautorizar la duda en el momento del cierre rompe la confianza.',
      },
    ],
  },
];

// --- Paquete 0.15: chats vivos, agenda del dia y buzoneo ---

// Comercios del distrito para el reparto fisico de folletos (coordenadas de mundo 3D).
export interface ComercioOpcion { texto: string; respuesta: string; xp: number; }
export interface ComercioCta { texto: string; reaccion: string; xp: number; reputacion?: number; mejor?: boolean; }
export interface Comercio {
  id: string; nombre: string; tipo: string; marca: string; tendero: string; x: number; z: number;
  saludo: string; objecion: string;
  conversacion: ComercioOpcion[];
  ctas: ComercioCta[];
}
// Misiones de folletos (1.1): en lugar de buzones, los folletos se entregan en
// comercios del barrio — futuros anunciantes. Entregar exige dialogar con el
// comerciante y rematar con un CTA; sin folletos se puede conversar (farming).
function ctasComercio(marca: string): ComercioCta[] {
  return [
    {
      texto: `Proponer que ${marca} aparezca como patrocinador en la próxima tanda de folletos, a cambio de una comisión por cada cliente que traiga`,
      reaccion: `Le gusta la idea: paga solo si le llevas clientes. Deja su tarjeta: ${marca} es tu anunciante potencial.`,
      xp: 20, reputacion: 2, mejor: true,
    },
    {
      texto: 'Dejar el folleto en el mostrador y pedirle que lo enseñe a sus clientes',
      reaccion: 'Lo coloca junto a la caja sin mucho convencimiento. Algo es algo.',
      xp: 12, reputacion: 1,
    },
    {
      texto: 'Pedirle directamente que te pase contactos de clientes que quieran vender',
      reaccion: 'Se echa atrás: "Hombre, mis clientes no se regalan". Aprendes que el CTA se construye, no se arranca.',
      xp: 8,
    },
  ];
}
export const COMERCIOS: Comercio[] = [
  {
    id: 'bz-nord', nombre: 'Frutería La Plaça', tipo: 'Frutería', marca: 'La Plaça Fruits', tendero: 'Andreu, el frutero', x: -8, z: 24,
    saludo: 'Andreu pesa unas mandarinas y te mira con curiosidad: "¿Tú eres el de los carteles de la inmobiliaria, no?"',
    objecion: '"Mira, al local no le faltan clientes. ¿Qué me aporta a mí tu folleto?"',
    conversacion: [
      { texto: 'Explicarle que tus folletos llegan a cada portal del barrio, justo donde sus vecinos deciden la compra del día', respuesta: '"Suena bien eso de estar en cada portal... cuéntame más."', xp: 10 },
      { texto: 'Decirle que todo el mundo reparte folletos y que es lo que toca', respuesta: '"Ya, eso me dicen todos." Baja la mirada y sigue pesando fruta.', xp: 4 },
      { texto: 'Presumir de agencia y de ventas sin hacerle ninguna pregunta', respuesta: '"Muy bien, muy bien." Corta la conversación para atender a una clienta.', xp: 6 },
    ],
    ctas: ctasComercio('La Plaça Fruits'),
  },
  {
    id: 'bz-est', nombre: 'Cafè del Carrer Est', tipo: 'Cafetería', marca: 'Cafè Est', tendero: 'Montse, la dueña', x: 24, z: -8,
    saludo: 'Montse te pone un cortado sin que lo pidas: "Los de la inmobiliaria nueva, ¿no? Aquí desayuna medio barrio."',
    objecion: '"Aquí viene mucho agente a dejar tarjetas. ¿Por qué iba a guardarte sitio a ti?"',
    conversacion: [
      { texto: 'Recordarle que su barra es el mejor CRM del barrio y que un trato contigo le trae clientes de desayuno', respuesta: '"Eso de la barra como oficina me lo dice mi marido todos los días." Se ríe y escucha.', xp: 10 },
      { texto: 'Ofrecerle dinero por dejar folletos sin explicarle nada más', respuesta: '"Aquí no compras el sitio así como así, joven." Te cobra el cortado.', xp: 4 },
      { texto: 'Contarle tus tres operaciones cerradas, con datos', respuesta: '"Mira, con números al menos hablas en serio."', xp: 6 },
    ],
    ctas: ctasComercio('Cafè Est'),
  },
  {
    id: 'bz-oest', nombre: "Farmàcia de l'Oest", tipo: 'Farmacia', marca: 'Farmàcia Oest', tendero: 'Raül, el farmacéutico', x: -40, z: -8,
    saludo: 'Raül sale del mostrador con bata y una sonrisa profesional: "¿Puedo ayudarte? Si es un resfriado, estás en el sitio correcto; si es venta de pisos, también te escucho."',
    objecion: '"Mi clientela es gente del barrio de toda la vida. No sé si pegan los folletos en una farmacia."',
    conversacion: [
      { texto: 'Señalar que la gente mayor del barrio es quien más le confía, y justo quien más ventas de piso decide', respuesta: '"No lo había pensado así... mis clientes de siempre me preguntan de todo, hasta de herencias."', xp: 10 },
      { texto: 'Decirle que los folletos los lee todo el mundo', respuesta: '"¿Todo el mundo? Hombre, pues no sé."', xp: 4 },
      { texto: 'Hablarle de marketing digital y de redes', respuesta: '"Eso me lo lleva mi sobrina." Mira la hora.', xp: 6 },
    ],
    ctas: ctasComercio('Farmàcia Oest'),
  },
  {
    id: 'bz-sud', nombre: 'Papereria Rambla Sud', tipo: 'Papelería', marca: 'Rambla Paper', tendero: 'Sílvia, la dueña', x: 8, z: 40,
    saludo: 'Sílvia clasifica postales junto a la puerta: "Tú debes de ser quien pone los carteles. Aquí se habla mucho de quién vende y quién no."',
    objecion: '"Mira, a mí los anuncios me van a regular. ¿Qué me propones exactamente?"',
    conversacion: [
      { texto: 'Proponerle un intercambio honesto: ella muestra tu folleto y tú recomiendas su tienda a cada cliente que se muda', respuesta: '"¿Los que compran necesitan cuadernos para el cole? Pues no suena nada mal."', xp: 10 },
      { texto: 'Decirle que es una oportunidad única que no puede dejar pasar', respuesta: '"Eso me decían los de las tarjetas de visita, y ahí están, en el cajón."', xp: 4 },
      { texto: 'Enseñarle tu cartera de operaciones sin conectarlo con su negocio', respuesta: '"Muy bonito, pero yo vendo libretas."', xp: 6 },
    ],
    ctas: ctasComercio('Rambla Paper'),
  },
  {
    id: 'bz-marina-mercado', nombre: 'Forn de La Marina', tipo: 'Panadería', marca: 'Forn Marina', tendero: 'Pau, el forner', x: -24, z: 56,
    saludo: 'Pau saca una bandeja de pan caliente: "Tú debes de ser el agente nuevo. En La Marina todo el mundo habla de pisos: te escucho."',
    objecion: '"El pan se vende solo. ¿Por qué iba a meterme yo con folletos de pisos?"',
    conversacion: [
      { texto: 'Contarle que quien compra pan cada día es quien sabe qué vecino se muda: su local es una antena del barrio', respuesta: '"¿Sabes qué? Es verdad. Ayer me dijo la Rosa que su hijo se va."', xp: 10 },
      { texto: 'Decirle que repartir folletos es barato y ya está', respuesta: '"Barato para ti quizá." Suspira con la bandeja.', xp: 4 },
      { texto: 'Ofrecerle comisión alta sin explicarle el servicio', respuesta: '"A ver, primero dime en qué consiste eso."', xp: 6 },
    ],
    ctas: ctasComercio('Forn Marina'),
  },
  {
    id: 'bz-marina-paseo', nombre: 'Bicis del Passeig', tipo: 'Tienda de bicis', marca: 'Passeig Bikes', tendero: 'Marta, la dueña', x: 24, z: 88,
    saludo: 'Marta engrasa una cadena en la puerta: "¿Tú por aquí? Todos los que se mudan nuevos a La Marina me acaban pasando por la tienda."',
    objecion: '"¿Publicidad? Lo último que probé fue un marcapáginas y no funcionó nada."',
    conversacion: [
      { texto: 'Conectar: cada comprador de vivienda nuevo en La Marina necesitará una bici — tú le llevas gente y ella te abre su comunidad', respuesta: '"Buen punto: si me traes vecinos nuevos, tu folleto queda en mi mostrador."', xp: 10 },
      { texto: 'Decirle que los folletos funcionan en general', respuesta: '"¿En general? Eso no me vale."', xp: 4 },
      { texto: 'Presumir de portal y de estadísticas', respuesta: '"A mí me hables de gente, no de estadísticas."', xp: 6 },
    ],
    ctas: ctasComercio('Passeig Bikes'),
  },
];
export const LOTE_FOLLETOS = 5;
export const PRECIO_LOTE_FOLLETOS = 10;

// Contexto minimo para decidir si un chat vivo esta disponible (evita dependencia circular con state.ts).
export interface ChatContexto {
  agenciaId: string | null;
  etapa: number;
  etapa2: number;
  etapa3: number;
  vendido: boolean;
  vendido2: boolean;
  vendido3: boolean;
  dia: number;
}

export interface ChatOpcionViva {
  texto: string;
  reaccion: string;
  confianza?: number;
  interes?: number;
  satisfaccion?: number;
  xp?: number;
  reputacion?: number;
  feedback: string;
}

export interface ChatVivo {
  id: string;
  nombre: string;
  avatar: string;
  contactoId?: string;
  contactoBase?: { nombre: string; tipo: string; nota: string };
  disponible: (c: ChatContexto) => boolean;
  entrada: string[];
  opciones: ChatOpcionViva[];
}

export const CHATS_VIVOS: ChatVivo[] = [
  {
    id: 'mentor-buzoneo',
    nombre: 'Mentor de la agencia',
    avatar: '',
    disponible: (c) => c.agenciaId !== null,
    entrada: [
      'Truco de la calle: imprime folletos en la oficina y llévalos a los comercios del barrio. No los dejes y ya: entra, habla con el comerciante y remata con tu propuesta. Esos comercios son tus futuros anunciantes.',
    ],
    opciones: [
      {
        texto: 'Buena idea: hoy mismo imprimo la primera tanda y me presento en los comercios.',
        reaccion: 'Eso es. La captación no espera detrás de una mesa: conversación y propuesta.',
        xp: 5,
        feedback: 'Al mentor le gusta tu iniciativa. +5 XP.',
      },
      {
        texto: 'Ya tengo los portales para darme a conocer.',
        reaccion: 'Los portales venden pisos; la calle te vende a ti. Piénsalo.',
        feedback: 'Respuesta válida, aunque el mentor cree que desaprovechas la calle.',
      },
    ],
  },
  {
    id: 'manuel-progreso',
    nombre: 'Don Manuel (propietario)',
    avatar: '',
    contactoId: 'propietario-mb',
    contactoBase: { nombre: 'Don Manuel (propietario)', tipo: 'Propietario particular', nota: 'Lleva 6 semanas vendiendo por su cuenta.' },
    disponible: (c) => c.etapa >= 9 && !c.vendido,
    entrada: [
      'Buenas. ¿Qué tal va el anuncio? Llevo días sin saber nada y la verdad, estoy un poco nervioso.',
    ],
    opciones: [
      {
        texto: 'Le paso un informe honesto: publicado en los portales, con visitas registradas y el plan de esta semana.',
        reaccion: 'Eso tranquiliza. Se nota que hay un profesional detrás.',
        confianza: 12,
        xp: 10,
        feedback: 'Informar antes de que pregunten: confianza +12, +10 XP.',
      },
      {
        texto: 'Todo va bien, no se preocupe. Ya le llamaré.',
        reaccion: 'Vale... ya. Bueno, quedo a la espera.',
        confianza: -8,
        feedback: 'Un "ya le llamaré" sin datos genera desconfianza: confianza -8.',
      },
      {
        texto: 'Si baja el precio 10.000 € lo vendo esta semana, se lo garantizo.',
        reaccion: '¿Cómo? ¿Pero no habíamos quedado en que el precio estaba bien valorado?',
        confianza: -12,
        interes: -8,
        feedback: 'Prometer sin datos para contentar sale caro: confianza -12, interés -8.',
      },
    ],
  },
  {
    id: 'laura-dudas',
    nombre: 'Laura (compradora)',
    avatar: '',
    contactoId: 'compradora-laura',
    contactoBase: { nombre: 'Laura (compradora)', tipo: 'Compradora', nota: 'Interesada en el piso de Nou Barris. Compra rápida y sin condiciones.' },
    disponible: (c) => c.etapa >= 10 && !c.vendido,
    entrada: [
      '¡Hola! Vi el piso en el portal y tengo la visita agendada. Antes de venir: ¿el precio tiene margen? ¿Y qué tal es la zona por la noche?',
    ],
    opciones: [
      {
        texto: 'El precio está apoyado en comparables de la zona y la calle es tranquila y bien iluminada. En la visita le enseño los datos.',
        reaccion: 'Perfecto, me gusta la claridad. Nos vemos en la visita.',
        interes: 15,
        confianza: 10,
        xp: 10,
        feedback: 'Datos y honestidad antes de la visita: interés +15, confianza +10, +10 XP.',
      },
      {
        texto: 'De margen mejor lo hablamos en persona. La zona es normal, como toda Barcelona.',
        reaccion: 'Hmm. Bueno, ya veremos en la visita.',
        interes: -10,
        feedback: 'Respuestas vagas antes de la visita enfrían el interés: interés -10.',
      },
      {
        texto: 'Si le gusta, el propietario seguro que baja bastante. Venga sin compromiso.',
        reaccion: '¿Ah sí? Pues entonces el precio del anuncio no es real...',
        interes: -5,
        confianza: -10,
        feedback: 'Prometer bajadas sin hablar con el propietario mina la confianza: confianza -10.',
      },
    ],
  },
  {
    id: 'manuel-gracias',
    nombre: 'Don Manuel (propietario)',
    avatar: '',
    contactoId: 'propietario-mb',
    contactoBase: { nombre: 'Don Manuel (propietario)', tipo: 'Propietario particular', nota: 'Lleva 6 semanas vendiendo por su cuenta.' },
    disponible: (c) => c.vendido,
    entrada: [
      '¡Vendido! Aún no me lo creo. Seis semanas yo solo, y usted lo cierra así. Gracias de verdad.',
    ],
    opciones: [
      {
        texto: 'Gracias por confiar. Si algún vecino o amigo se plantea vender, la mejor recomendación es la suya.',
        reaccion: 'Puede contar con ello: esta semana hablo con dos vecinos.',
        reputacion: 2,
        xp: 10,
        feedback: 'La recomendación es el cierre profesional de una venta: reputación +2, +10 XP.',
      },
      {
        texto: 'Ha sido un placer, don Manuel. Cuídese y disfrute del cambio.',
        reaccion: 'Igualmente. Gente como usted hace falta en este barrio.',
        satisfaccion: 10,
        xp: 5,
        feedback: 'Un cierre cálido cuida la relación: satisfacción +10, +5 XP.',
      },
      {
        texto: 'Y recuerde: si compra otra vivienda, yo también se la gestiono.',
        reaccion: 'Hombre, primero déjeme asimilar esta venta... pero lo tendré en cuenta.',
        satisfaccion: -5,
        xp: 5,
        feedback: 'Venderle algo nuevo el día de la alegría suena a prisa: satisfacción -5, +5 XP.',
      },
    ],
  },
];

// ── La Marina: nuevo distrito (1.0) ──────────────────────────────────────
// Encuentros callejeros: decisiones con consecuencias reales (XP, reputación,
// citas). Los unicos se juegan una vez; los de barrio reaparecen con pausa.
export interface EncuentroOpcion {
  texto: string;
  xp: number;
  reputacion?: number;
  feedback: string;
  cita?: { titulo: string; tipo: string };
}
export interface Encuentro {
  id: string;
  titulo: string;
  texto: string;
  unico: boolean;
  pausa?: number; // dias minimos entre repeticiones (solo no unicos)
  opciones: EncuentroOpcion[];
}
export const ENCUENTROS: Encuentro[] = [
  {
    id: 'enc-herencia', titulo: 'Dos hermanos con una herencia', unico: true,
    texto: 'Dos hermanos discuten en la puerta de un piso heredado. Uno quiere vender ya, el otro alquilar. Te reconocen del barrio y te piden opinión.',
    opciones: [
      { texto: 'Escuchar a los dos y explicar con calma qué implica cada opción', xp: 20, reputacion: 2, feedback: 'Te tomas el tiempo de explicar impuestos, rentas y plazos reales. No te quedas la venta todavía, pero se van con tu tarjeta y tu nombre. +18 XP y +2 reputación.' },
      { texto: 'Empujar la venta: es tu negocio', xp: 8, feedback: 'El que quiere alquilar se cierra en banda. El otro te da el teléfono, pero la confianza queda tocada. +8 XP.' },
      { texto: 'Sugerir que hablen primero con un gestor y ofrecerte para después', xp: 12, reputacion: 1, feedback: 'Prudente y honesto. Te guardan el contacto para cuando decidan. +12 XP y +1 reputación.' },
    ],
  },
  {
    id: 'enc-vecina-balcón', titulo: 'La vecina del balcón de flores', unico: true,
    texto: 'Una vecina mayor riega el balcón más bonito de la calle. Su marido ha fallecido hace un año y la casa le queda grande. "No sé ni por dónde empezar", te dice.',
    opciones: [
      { texto: 'Ofrecerle una visita sin compromiso para valorar la casa', xp: 16, reputacion: 1, feedback: 'Le dejas tu tarjeta con la hora apuntada a boli. Te da las gracias dos veces. +15 XP y +1 reputación.' },
      { texto: 'Hablarle del precio que se está pagando en la calle', xp: 6, feedback: 'Le interesa, pero va demasiado rápido para ella. Corteja la conversación y sigue regando. +6 XP.' },
      { texto: 'Solo conversar: a veces el oficio es escuchar', xp: 10, reputacion: 2, feedback: 'Habláis veinte minutos de la calle y de sus flores. Al despedirte te dice que hablará contigo cuando decida. En el barrio estas cosas corren. +10 XP y +2 reputación.' },
    ],
  },
  {
    id: 'enc-inversor-prisa', titulo: 'Un inversor con mucha prisa', unico: true,
    texto: 'Un hombre de traje para el coche: "Compro cualquier cosa en esta zona, cierro en dos semanas, no me importa el estado". Huele a negocio... o a lío.',
    opciones: [
      { texto: 'Pedir referencias y anotar sus datos con cautela', xp: 16, feedback: 'Titubea con las referencias. Anotas el contacto, pero decides no presentarle a ningún propietario hasta saber más. +14 XP.' },
      { texto: 'Pasarle enseguida dos direcciones de posibles ventas', xp: 5, reputacion: -1, feedback: 'A los dos días los propietarios te llaman molestos: el hombre presiona con tácticas raras. -1 reputación, +5 XP por la lección.' },
      { texto: 'Decirle que trabajas por encargo, no por catálogo', xp: 12, reputacion: 1, feedback: 'Se va con una sonrisa torcida. Un testigo de la escena te comenta luego: "Bien hecho, ese no es trigo limpio". +12 XP y +1 reputación.' },
    ],
  },
  {
    id: 'enc-pareja-primera', titulo: 'Pareja buscando su primer piso', unico: true,
    texto: 'Una pareja joven mira escaparates con cara de agobio. Llevan seis meses buscando y cada visita es una decepción. No son tus clientes... todavía.',
    opciones: [
      { texto: 'Regalarles diez minutos: explicarles qué mirar en una visita', xp: 16, reputacion: 1, feedback: 'Instalaciones, orientación, ruidos, comunidad. Se lo apuntan todo en el móvil. Te siguen en redes y recomiendan tu nombre. +14 XP y +1 reputación.' },
      { texto: 'Ofrecerte como agente de compra con honorarios claros', xp: 10, feedback: 'Se lo piensan. Al menos ahora saben que esa figura existe. +10 XP.' },
    ],
  },
  {
    id: 'enc-tendera', titulo: 'La tendera que lo sabe todo', unico: true,
    texto: 'La dueña de la tienda de ultramarinos te frena: "Aquí se entera una de todo antes que Idealista. El 3º del 42 sale a la venta el mes que viene, y el bajo de la esquina también".',
    opciones: [
      { texto: 'Apuntar las dos pistas y agradecérselo con una compra', xp: 20, reputacion: 1, feedback: 'Dos pistas reales por el precio de un café y media docena de huevos. Las anotas para visitarlas. +16 XP y +1 reputación.' },
      { texto: 'Preguntarle si quiere ser tu "antena" oficial del barrio', xp: 12, reputacion: 2, feedback: 'Se ríe, pero acepta: un detalle por cada venta que salga de sus pistas. Acabas de crear una red de captación de la vieja escuela. +12 XP y +2 reputación.' },
    ],
  },
  {
    id: 'enc-mudanza', titulo: 'Una mudanza en marcha', unico: true, pausa: 0,
    texto: 'Un camión de mudanzas bloquea media calle. Los que se van dejan el piso vacío; los que llegan, lleno de cajas. En esta profesión, las mudanzas son señales.',
    opciones: [
      { texto: 'Ayudar un rato a los que llegan y presentarte', xp: 14, reputacion: 1, feedback: 'Cuarenta minutos cargando cajas. Los nuevos vecinos ya tienen agente de confianza para cuando toque. +12 XP y +1 reputación.' },
      { texto: 'Anotar el piso que queda libre para investigar al propietario', xp: 10, feedback: 'Piso vacío = posible venta o alquiler próximo. Lo apuntas en tu libreta de captación. +10 XP.' },
    ],
  },
  {
    id: 'enc-notario', titulo: 'Cola en la notaría', unico: true,
    texto: 'Pasas por la notaría y reconoces al oficial tomando café en la esquina. Es la persona que mejor conoce el ritmo real de compraventas del distrito.',
    opciones: [
      { texto: 'Presentarte y preguntarle cómo ve el mercado este trimestre', xp: 20, feedback: 'Veinte minutos de conversación de oro: precios reales de cierre, barrios que se mueven, errores que ve cada semana. Masterclass gratuita. +15 XP.' },
      { texto: 'Ofrecerle tu tarjeta por si algún cliente pregunta', xp: 8, reputacion: 1, feedback: 'La acepta con educación. Los canales formales también cuentan. +8 XP y +1 reputación.' },
    ],
  },
  {
    id: 'enc-portera', titulo: 'La portera del Eixample', unico: true,
    texto: 'La portera de una finca señorial te reconoce de los carteles. Treinta años en la escalera: sabe qué pisos saldrán antes que los propios propietarios. "Aquí el 2º 1ª y el 5º 2ª están al caer", suelta, como quien no quiere la cosa.',
    opciones: [
      { texto: 'Ofrecerle un trato claro: detalle por cada venta que salga de sus pistas', xp: 20, reputacion: 1, feedback: 'Trato hecho: la portera gana con cada operación y tú tienes la mejor red de captación del Eixample. +20 XP y +1 reputación.' },
      { texto: 'Anotar las dos pistas sin comprometer nada', xp: 12, feedback: 'Dos direcciones concretas en la libreta. La relación queda en un simple buenos días. +12 XP.' },
      { texto: 'Decirle que solo trabajas con propietarios directos', xp: 6, feedback: 'Asiente sin convicción. Las pistas se quedan en la escalera. +6 XP.' },
    ],
  },
  // Reaparecibles: vida de barrio, XP pequeña y natural.
  {
    id: 'enc-café-barrio', titulo: 'Café en el bar de siempre', unico: false, pausa: 2,
    texto: 'El camarero te guarda la barra y te pone al día: quién se casa, quién se divorcia, quién hereda, quién se muda. El bar es el mejor CRM del barrio.',
    opciones: [
      { texto: 'Quedarte a la conversación', xp: 6, reputacion: 1, feedback: 'Media hora de actualidad vecinal. Algún nombre acabará en tu agenda. +6 XP y +1 reputación.' },
      { texto: 'Café rápido y de vuelta al trabajo', xp: 3, feedback: 'Te enteras de lo justo. +3 XP.' },
    ],
  },
  {
    id: 'enc-paseo-marina', titulo: 'Paseo por La Marina', unico: false, pausa: 2,
    texto: 'Recorres La Marina con ojo profesional: escaparates, carteles de "se vende", reformas en marcha. El distrito se mueve.',
    opciones: [
      { texto: 'Anotar carteles y reformas en tu libreta', xp: 6, feedback: 'Tres pistas nuevas para investigar. Conocer tu territorio es el oficio. +6 XP.' },
      { texto: 'Saludar a los comerciantes de la zona', xp: 4, reputacion: 1, feedback: 'Tu cara empieza a ser conocida en La Marina. +4 XP y +1 reputación.' },
    ],
  },
  {
    id: 'enc-chat-portal', titulo: 'Pregunta por el portal', unico: false, pausa: 3,
    texto: 'Un interesado escribe por el portal preguntando si el barrio es seguro y cómo está el mercado. No es lead caliente, pero es tu nombre el que está ahí.',
    opciones: [
      { texto: 'Responder con datos reales y sin humo', xp: 6, reputacion: 1, feedback: 'Respuesta honesta, con cifras y sin vender la moto. Te lo agradece y guarda tu anuncio. +6 XP y +1 reputación.' },
      { texto: 'Respuesta corta: que venga a verlo', xp: 3, feedback: 'Cumples, sin más. +3 XP.' },
    ],
  },
];
// Puntos de aparición de encuentros (coordenadas de mundo 3D): mezcla del distrito original y La Marina.
export const SPAWNS_ENCUENTROS: { x: number; z: number }[] = [
  { x: -24, z: 24 }, { x: 24, z: -24 }, { x: -40, z: 24 }, { x: 8, z: 24 },
  { x: -8, z: 56 }, { x: 24, z: 72 }, { x: -24, z: 88 }, { x: 8, z: 88 },
];

// ── 1.1 · Formación continua: tip diario de la Academia ──────────────────
export const TIPS_DIARIOS: string[] = [
  'Un propietario no recuerda tu comisión; recuerda si le informaste antes de que preguntara.',
  'El precio de salida se defiende con testigos de venta reales, no con opiniones.',
  'La mejor captación es la venta bien cerrada de ayer: pide siempre la recomendación.',
  'Una visita sin cualificar es un paseo turístico: presupuesto, plazos y motivación antes de enseñar.',
  'El cartel en el balcón sigue vendiendo: es el anuncio que se ve sin wifi.',
  'En negociación, quien habla de plazos y condiciones suele ganar más que quien habla solo de precio.',
  'Fotos con luz de mañana y persianas subidas: el primer clic se gana en la miniatura.',
  'Apunta cada conversación en el CRM el mismo día: la memoria es mala agente.',
  'Un "no" a tiempo es mejor que un "quizá" que te consume tres semanas.',
  'Los comercios del barrio saben antes que los portales quién se muda: cuídalos.',
  'La exclusiva se gana demostrando plan de trabajo, no pidiendo confianza a ciegas.',
  'Después de cada cierre, agenda la llamada de seguimiento a los 30 días.',
  'El comprador compra la casa dos veces: primero en el anuncio, luego en la visita.',
  'Cobra tu reputación cada día: pequeños gestos, registros y cumplir lo prometido.',
];

// ── 1.1 · Oportunidades libres: rotación de captación tras vender ────────
export interface PropiedadLibre {
  id: string; titulo: string; barrio: string; precio: number; metros: number;
  habitaciones: number; descripcion: string; vendedor: string; motivo: string;
}
export const PROPIEDADES_LIBRES: PropiedadLibre[] = [
  { id: 'libre-marina-bajo', titulo: 'Bajo con patio en La Marina', barrio: 'La Marina', precio: 165000, metros: 58, habitaciones: 2, descripcion: 'Bajo con patio interior de 20 m², dos habitaciones y mucha luz por la tarde. Anuncio de particular con precio de hace dos años.', vendedor: 'La Rosa, vecina de toda la vida', motivo: 'Se muda con su hija a Hospitalet y quiere vender sin líos ni prisas mal llevadas.' },
  { id: 'libre-clot-reforma', titulo: 'Piso para reformar en el Clot', barrio: 'El Clot', precio: 149000, metros: 64, habitaciones: 3, descripcion: 'Tres habitaciones, finca con encanto y mucho por hacer: ideal para inversor o pareja con proyecto. Lleva cuatro meses anunciado sin reforma explicada.', vendedor: 'Los herederos de un piso de familia', motivo: 'Cuatro hermanos repartidos por España quieren cerrar la herencia antes de verano.' },
  { id: 'libre-santantoni-estudio', titulo: 'Estudio con balcón en Sant Antoni', barrio: 'Sant Antoni', precio: 172000, metros: 41, habitaciones: 1, descripcion: 'Estudio exterior con balcón, cocina americana y finca rehabilitada. El barrio tira fuerte y el anuncio tiene fotos oscuras.', vendedor: 'Un inquilino que compró para invertir', motivo: 'Lo alquiló durante años y ahora prefiere liquidez para otro negocio.' },
  { id: 'libre-horta-atico', titulo: 'Ático interior tranquilo en Horta', barrio: 'Horta', precio: 196000, metros: 55, habitaciones: 2, descripcion: 'Última planta interior, silencioso, con dos habitaciones y trastero. Finca sin ascensor, bien comunicada con el metro.', vendedor: 'Una pareja que se jubila', motivo: 'Se van a un piso con ascensor cerca de los nietos y quieren una venta ordenada.' },
  { id: 'libre-lescorts-familiar', titulo: 'Piso familiar junto a Travessera de Les Corts', barrio: 'Les Corts', precio: 265000, metros: 82, habitaciones: 3, descripcion: 'Tres habitaciones dobles, dos baños y galería al patio de manzana. Zona consolidada, colegios al lado y mucha demanda familiar.', vendedor: 'Un matrimonio que hace las Américas', motivo: 'Traslado laboral a Ciudad de México: quieren vender antes del verano.' },
  { id: 'libre-poblenou-loft', titulo: 'Loft luminoso en Poblenou', barrio: 'Poblenou', precio: 238000, metros: 70, habitaciones: 1, descripcion: 'Antigua nave reconvertida: techos altos, ventanales y espacio abierto. Perfil creativo o teletrabajo con encanto industrial.', vendedor: 'Un diseñador que se muda a un dúplex', motivo: 'Necesita más espacio y quiere vender a alguien que valore el loft como él lo cuidó.' },
];
export const PRECIO_PUBLICACION_LIBRE = 45;

// ── 1.1 · Mentor de la agencia: solo el paso siguiente + su TIP ──────────
// Los mensajes resueltos desaparecen: queda el paso en desarrollo con su consejo.
export interface MentorPaso {
  cuando: (c: ChatContexto) => boolean;
  mensaje: string;
  tip: string;
}
export const MENTOR_PASOS: MentorPaso[] = [
  {
    cuando: (c) => c.agenciaId !== null,
    mensaje: '¡Enhorabuena por el puesto! Yo seré tu mentor. Tu primera misión: encuentra un particular que lleve semanas sin vender y ofrécele un diagnóstico honesto.',
    tip: 'Los anuncios de particulares con semanas en el portal y bajadas de precio son tu mejor puerta de entrada: dolor real, ayuda bienvenida.',
  },
  {
    cuando: (c) => c.etapa >= 2,
    mensaje: 'Buen primer contacto. Recuerda: cualificar es entender el motivo real de la venta, no solo el precio.',
    tip: 'Pregunta siempre por el "para qué" detrás de la venta: mudanza, herencia, liquidez. El motivo marca el plan.',
  },
  {
    cuando: (c) => c.etapa >= 4,
    mensaje: 'Cita conseguida. Prepara comparables de la zona y llega puntual: la puntualidad también vende.',
    tip: 'Lleva tres testigos de venta impresos: el papel con datos calma más que cualquier discurso.',
  },
  {
    cuando: (c) => c.etapa >= 5,
    mensaje: 'Valoración hecha. Ahora presenta el plan completo y pide el encargo sin miedo.',
    tip: 'El encargo se pide mirando a los ojos y con el plan por escrito. Si no lo pides, otro lo hará.',
  },
  {
    cuando: (c) => c.etapa >= 7,
    mensaje: '¡Encargo! Ahora al portátil: anuncio con buen título, descripción honesta y precio de mercado. Luego publícalo en uno o varios portales, según tu saldo; puedes ampliar el alcance más adelante.',
    tip: 'Título corto, primera foto con la mejor luz y descripción sin exagerar: el anuncio honesto vende dos veces.',
  },
  {
    cuando: (c) => c.etapa >= 9,
    mensaje: 'Anuncio en la calle. Cuando lleguen interesados, filtra bien y agenda la visita. La negociación se trabaja con datos y plazos.',
    tip: 'Cualifica antes de agendar: presupuesto, financiación y plazos. Las visitas sin filtro queman tu agenda.',
  },
  {
    cuando: (c) => c.vendido,
    mensaje: '¡Tu primera venta! Cierra el círculo: agradece, pide recomendación y apunta todo en el CRM. Esto ya es un negocio.',
    tip: 'La recomendación se pide el día de la alegría, no un mes después. Y a los 30 días, llama para seguir cuidando.',
  },
  {
    cuando: (c) => c.etapa >= 13 && !c.vendido2 && c.etapa2 === 0,
    mensaje: 'Don Manuel ha cumplido su palabra: su vecina Carmen vende un dúplex en Sants por herencia. Preséntate con datos y escucha a los dos hermanos.',
    tip: 'En una herencia hay tantas ventas como herederos: escucha a todos por separado antes de proponer nada.',
  },
  {
    cuando: (c) => c.etapa2 >= 4 && c.etapa2 < 7,
    mensaje: 'Carmen te espera para la valoración del dúplex. En una herencia, los datos hablan mejor que nadie.',
    tip: 'Con herederos en desacuerdo, el testigo de venta es tu mediador: el dato no discute con nadie.',
  },
  {
    cuando: (c) => c.etapa2 >= 7 && c.etapa2 < 9,
    mensaje: 'Encargo del dúplex firmado. Anuncio honesto y a los portales: cada portal cuesta 45 €, elige con cabeza.',
    tip: 'Más portales, más interesados y antes. Si el saldo aprieta, cubre primero donde más se mueve la zona.',
  },
  {
    cuando: (c) => c.etapa2 >= 9 && c.etapa2 < 11,
    mensaje: 'El dúplex ya está en portales. Cuando haya interesados, la visita se atiende en Sants.',
    tip: 'Prepara la visita con las fortalezas del dúplex en la cabeza: terraza, luz y estación cerca.',
  },
  {
    cuando: (c) => c.etapa2 >= 13 && !c.vendido3 && c.etapa3 === 0,
    mensaje: 'Tu nombre corre por los barrios: Núria vende su ático de Gràcia antes de mudarse a Sitges. Le llegaste por los hermanos Vidal.',
    tip: 'Cada venta bien cerrada siembra la siguiente. La cadena de recomendaciones es tu mejor canal.',
  },
  {
    cuando: (c) => c.etapa3 >= 4 && c.etapa3 < 7,
    mensaje: 'Núria te espera para la valoración del ático. Recuerda lo que le prometiste: visitas filtradas o nada.',
    tip: 'Lo que prometes en la captación se convierte en tu estándar: escríbelo y cúmplelo.',
  },
  {
    cuando: (c) => c.etapa3 >= 7 && c.etapa3 < 9,
    mensaje: 'Encargo del ático firmado. Fotos de la terraza al atardecer y a los portales: cada portal cuesta 45 €.',
    tip: 'La terraza al atardecer es la primera foto: la luz cálida vende la vida que hay detrás del inmueble.',
  },
  {
    cuando: (c) => c.etapa3 >= 9 && c.etapa3 < 11,
    mensaje: 'El ático ya está en portales. Cuando haya interesados, la visita se atiende en Gràcia.',
    tip: 'Confirma las visitas la víspera: una visita plantada es una tarde perdida.',
  },
  {
    cuando: (c) => c.etapa2 === 11,
    mensaje: 'Marc, el inversor, espera respuesta. Negocia con datos y plazos concretos.',
    tip: 'Con inversores habla de rentabilidad y calendario, no de emociones: su idioma es el número.',
  },
  {
    cuando: (c) => c.vendido2,
    mensaje: '¡Segunda venta! Dos operaciones completas: la calle ya sabe quién eres.',
    tip: 'Dos cierres ya son patrón: escribe qué repetiste y qué cambiaste. Eso es tu método.',
  },
  {
    cuando: (c) => c.vendido3,
    mensaje: 'Tres operaciones principales cerradas: la agencia está orgullosa. Revisa los requisitos de Senior y sigue con formación y operaciones libres del barrio para avanzar.',
    tip: 'Después de la carrera viene el oficio diario: comercios, oportunidades libres y formación continua. El barrio siempre tiene otra puerta.',
  },
];
