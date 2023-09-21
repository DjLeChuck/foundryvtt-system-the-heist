export function registerHandlebarsHelper() {
  Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase();
  });

  Handlebars.registerHelper('length', function (value) {
    return value ? value.length : 0;
  });

  Handlebars.registerHelper('formattedTimeLeft', function (timeLeft) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });
}
