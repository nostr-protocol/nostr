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
