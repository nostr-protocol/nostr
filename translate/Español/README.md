# nostr - Notas y Otros Contenidos Transmitidos por Relevos
> Notes and Other Stuff Transmitted by Relays

El protocolo abierto más simple capaz de crear una red "social" global resistente a la censura de una vez por todas.

No depende de ningún servidor central de confianza, por lo tanto es resistente; se basa en claves y firmas criptográficas, por lo que es a prueba de manipulaciones; no depende de técnicas P2P, y por lo tanto funciona.

## Resumen muy breve de cómo funciona, si no planeas leer nada más:

Todo el mundo ejecuta un cliente. Puede ser un cliente nativo, un cliente web, etc. Para publicar algo, escribes una publicación, la firmas con tu clave y la envías a múltiples relevos (servidores alojados por alguien más, o por ti mismo). Para obtener actualizaciones de otras personas, preguntas a múltiples relevos si saben algo sobre esas otras personas. Cualquiera puede ejecutar un relé. Un relé es muy simple y tonto. No hace nada más que aceptar publicaciones de algunas personas y reenviarlas a otras. Los relevos no tienen que ser confiables. Las firmas se verifican en el lado del cliente.

[Cómo empezar a usar Nostr](https://github.com/vishalxl/nostr_console/discussions/31)

[Comparación de características de clientes de Nostr](https://github.com/vishalxl/Nostr-Clients-Features-List/blob/main/Readme.md)

[Lista de proyectos construidos en Nostr](https://github.com/aljazceru/awesome-nostr)

## Esto es necesario porque otras soluciones están rotas:

### El problema con Twitter

- Twitter tiene anuncios;
- Twitter utiliza técnicas extrañas para mantenerte adicto;
- Twitter no muestra un flujo histórico real de personas que sigues;
- Twitter prohíbe a las personas;
- Twitter hace shadowban a las personas;
- Twitter tiene mucho spam.

### El problema con Mastodon y programas similares

- Las identidades de usuario están asociadas con nombres de dominio controlados por terceros;
- Los dueños de los servidores pueden prohibirte, como en Twitter; Los dueños del servidor también pueden bloquear otros servidores;
- La migración entre servidores es una idea secundaria y solo se puede lograr si los servidores cooperan. No funciona en un entorno adversarial (se pierden todos los seguidores).
- No hay incentivos claros para ejecutar servidores, por lo tanto, tienden a ser operados por entusiastas y personas que quieren tener su nombre adjunto a un dominio genial. Luego, los usuarios están sujetos al despotismo de una sola persona, lo que a menudo es peor que el de una gran empresa como Twitter, y no pueden migrar;
- Dado que los servidores tienden a ser operados de manera amateur, a menudo son abandonados después de un tiempo, lo que es efectivamente lo mismo que prohibir a todo el mundo;
- No tiene sentido tener toneladas de servidores si las actualizaciones de cada servidor tendrán que ser dolorosamente empujadas (¡y guardadas!) a toneladas de otros servidores. Este punto se ve exacerbado por el hecho de que los servidores tienden a existir en grandes cantidades, por lo que se debe pasar más datos a más lugares con más frecuencia;
- Para el ejemplo específico de compartir videos, los entusiastas de ActivityPub se dieron cuenta de que sería completamente imposible transmitir videos de servidor a servidor de la misma manera que se hacen las notas de texto, por lo que decidieron mantener el video alojado solo desde la única instancia donde se publicó, lo que es similar al enfoque de Nostr.

### El problema con SSB (Secure Scuttlebutt)

- No tiene muchos problemas. Me parece genial. Iba a usarlo como base para esto, pero
- su protocolo es demasiado complicado porque no se pensó en ser un protocolo abierto en absoluto. Simplemente se escribió en JavaScript probablemente de manera rápida para resolver un problema específico y creció a partir de eso, por lo tanto, tiene peculiaridades extrañas e innecesarias como firmar una cadena JSON que debe seguir estrictamente las reglas de [_ECMA-262 6th Edition_](https://www.ecma-international.org/ecma-262/6.0/#sec-json.stringify);
- insiste en tener una cadena de actualizaciones de un solo usuario, lo cual me parece innecesario y algo que agrega inflado y rigidez a la cosa; cada servidor/usuario debe almacenar toda la cadena de publicaciones para estar seguro de que la nueva es válida. ¿Por qué? (Tal vez tengan una buena razón);
- No es tan simple como Nostr, ya que se hizo principalmente para la sincronización P2P, siendo las "pubs" una idea secundaria;
- Aún así, puede valer la pena considerar el uso de SSB en lugar de este protocolo personalizado y simplemente adaptarlo al modelo cliente-relé de servidor, porque reutilizar un estándar siempre es mejor que tratar de hacer que la gente se una a uno nuevo.

## Problemas con otras soluciones que requieren que todos ejecuten su propio servidor

- Requieren que todos ejecuten su propio servidor;
- A veces, las personas aún pueden ser censuradas en estas soluciones porque los nombres de dominio pueden ser censurados.

## ¿Cómo funciona Nostr?

- Hay dos componentes: __clientes__ y __retransmisiones__. Cada usuario ejecuta un cliente. Cualquiera puede ejecutar una retransmisión.
- Cada usuario está identificado por una clave pública. Cada publicación está firmada. Cada cliente valida estas firmas.
- Los clientes recuperan datos de las retransmisiones de su elección y publican datos en otras retransmisiones de su elección. Una retransmisión no habla con otra retransmisión, solo directamente con los usuarios.
- Por ejemplo, para "seguir" a alguien, un usuario simplemente instruye a su cliente que consulte las retransmisiones que conoce para obtener publicaciones de esa clave pública.
- Al iniciarse, un cliente consulta datos de todas las retransmisiones que conoce para todos los usuarios que sigue (por ejemplo, todas las actualizaciones desde el día anterior), luego muestra esos datos al usuario cronológicamente.
- Una "publicación" puede contener cualquier tipo de datos estructurados, pero los más utilizados encontrarán su camino en el estándar para que todos los clientes y retransmisiones puedan manejarlos sin problemas.

## ¿Cómo resuelve los problemas que las redes anteriores no pueden?

- **Usuarios baneados y servidores cerrados**
  - Un relay puede bloquear a un usuario para publicar en él, pero eso no tiene efecto ya que aún puede publicar en otros relays. Como los usuarios son identificados por una clave pública, no pierden su identidad ni su base de seguidores cuando son baneados.
  - En lugar de requerir que los usuarios escriban manualmente nuevas direcciones de relays (aunque también debería ser compatible), cuando alguien que sigues publica una recomendación de servidor, el cliente debe agregar automáticamente eso a la lista de relays que consultará.
  - Si alguien está usando un relay para publicar sus datos pero quiere migrar a otro, puede publicar una recomendación de servidor en ese relay anterior y listo.
  - Si alguien es baneado de muchos relays de manera que no puede hacer que sus recomendaciones de servidor se transmitan, aún puede informar a algunos amigos cercanos a través de otros medios en qué relay está publicando ahora. Entonces, estos amigos cercanos pueden publicar recomendaciones de servidor a ese nuevo servidor y, lentamente, la antigua base de seguidores del usuario baneado comenzará a encontrar sus publicaciones nuevamente desde el nuevo relay.
  - Todo lo anterior también es válido cuando un relay cesa sus operaciones.

- **Resistencia a la censura**
  - Cada usuario puede publicar sus actualizaciones en cualquier cantidad de retransmisiones.
  - Una retransmisión puede cobrar una tarifa (la negociación de esa tarifa está fuera del protocolo por ahora) a los usuarios para publicar allí, lo que asegura la resistencia a la censura (siempre habrá algún servidor ruso dispuesto a tomar su dinero a cambio de servir sus publicaciones).

- **Spam**
  - Si el spam es una preocupación para una retransmisión, puede requerir un pago por publicación u otra forma de autenticación, como una dirección de correo electrónico o un teléfono, y asociarlos internamente con una pubkey que luego pueda publicar en esa retransmisión, o utilizar otras técnicas anti-spam, como hashcash o captchas. Si una retransmisión está siendo utilizada como vector de spam, puede ser fácilmente eliminada de la lista por los clientes, que pueden continuar obteniendo actualizaciones de otras retransmisiones.

- **Almacenamiento de datos**
  - Para que la red funcione correctamente, no se necesitan cientos de relays activos. De hecho, puede funcionar perfectamente bien con solo unos pocos, dado que nuevos relays pueden crearse y propagarse fácilmente en la red en caso de que los relays existentes comiencen a comportarse mal. Por lo tanto, la cantidad de almacenamiento de datos requerido, en general, es relativamente menor que en Mastodon u otro software similar.
  - O considerando un resultado diferente: uno en el que existen cientos de relays de nicho administrados por aficionados, cada uno transmitiendo actualizaciones de un pequeño grupo de usuarios. La arquitectura también es escalable: los datos se envían desde los usuarios a un servidor único y desde ese servidor directamente a los usuarios que los consumirán. No es necesario que nadie más los almacene. En esta situación, no es una gran carga para ningún servidor procesar actualizaciones de otros, y tener servidores de aficionados no es un problema.

- **Video y otro contenido pesado**
  - Es fácil para un relay rechazar contenido grande o cobrar por aceptar y alojar contenido grande. Cuando la información y los incentivos son claros, es fácil para las fuerzas del mercado resolver el problema.

- **Técnicas para engañar al usuario**
  - Cada cliente puede decidir cómo mostrar mejor las publicaciones a los usuarios, por lo que siempre está la opción de consumir solo lo que desee de la manera que desee, desde usar una inteligencia artificial para decidir el orden de las actualizaciones que verá hasta simplemente leerlas en orden cronológico.

## Preguntas frecuentes

- **Esto es muy simple. ¿Por qué nadie lo ha hecho antes?**

  No lo sé, pero imagino que tiene que ver con el hecho de que las personas que crean redes sociales son empresas que quieren ganar dinero o activistas P2P que quieren hacer una cosa completamente sin servidores. Ambos no ven la mezcla específica de ambos mundos que utiliza Nostr.

- **¿Cómo encuentro personas a las que seguir?**

  Primero, debes conocerlas y obtener su clave pública de alguna manera, ya sea preguntándoles o viéndola referenciada en algún lugar. Una vez que estás dentro de una red social de Nostr, podrás verlas interactuando con otras personas y así también puedes empezar a seguir e interactuar con estos otros.

- **¿Cómo encuentro relays? ¿Qué sucede si no estoy conectado a los mismos relays que alguien más?**

  No podrás comunicarte con esa persona. Pero hay pistas en eventos que se pueden utilizar para que tu software cliente (o tú manualmente) sepa cómo conectarse al relay de la otra persona e interactuar con ella. Hay otras ideas sobre cómo resolver esto en el futuro, pero nunca podemos prometer una accesibilidad perfecta, ningún protocolo puede hacerlo.

- **¿Puedo saber cuántas personas me siguen?**

  No, pero puedes obtener algunas estimaciones si los relays cooperan de manera extra-protocolo.

- **¿Qué incentivo hay para que la gente ejecute relays?**

  La pregunta es engañosa. Parte de la premisa de que los relays son tuberías tontas gratuitas que existen para que la gente pueda mover datos a través de ellas. En este caso, es cierto que no habría incentivos. Esto podría decirse de los nodos DHT en todas las otras pilas de redes p2p: ¿qué incentivo hay para que la gente ejecute nodos DHT?

- **Nostr te permite moverte entre los relays del servidor o usar múltiples relays, pero si estos relays están en AWS o Azure, ¿cuál es la diferencia?**

  Literalmente hay miles de proveedores de VPS repartidos por todo el mundo hoy en día, no solo AWS o Azure. AWS o Azure son precisamente los proveedores utilizados por los proveedores de servicios centralizados únicos que necesitan mucha escala, y aun así no solo estos dos. Para los servidores de relay más pequeños, cualquier VPS hará perfectamente el trabajo.

## Especificación del protocolo

Consulte los [NIPs](https://github.com/nostr-protocol/nips) y especialmente [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) para obtener una explicación razonablemente detallada de la especificación del protocolo (pista: es muy corta y simple).

## Software

Hay una lista de la mayoría del software que se está construyendo utilizando Nostr en https://github.com/aljazceru/awesome-nostr que parecía estar casi completa la última vez que lo miré.

## Licencia

Dominio público.
