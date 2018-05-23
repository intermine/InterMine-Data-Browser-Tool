// Chart.js scripts
// -- Set new default font family and font color to mimic Bootstrap's default styling
Chart.defaults.global.defaultFontFamily = '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#292b2c';
// -- Pie Chart Example
var ctx = document.getElementById("myPieChart");

var pieOptions = {
  events: false,
  animation: {
    duration: 500,
    easing: "easeOutQuart",
    onComplete: function () {
      var ctx = this.chart.ctx;
      ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontFamily, 'normal', Chart.defaults.global.defaultFontFamily);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      this.data.datasets.forEach(function (dataset) {

        for (var i = 0; i < dataset.data.length; i++) {
          var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model,
              total = dataset._meta[Object.keys(dataset._meta)[0]].total,
              mid_radius = model.innerRadius + (model.outerRadius - model.innerRadius)/2,
              start_angle = model.startAngle,
              end_angle = model.endAngle,
              mid_angle = start_angle + (end_angle - start_angle)/2;

          var x = mid_radius * Math.cos(mid_angle);
          var y = mid_radius * Math.sin(mid_angle);

          ctx.fillStyle = '#fff';
          if (i == 3){ // Darker text color for lighter background
            ctx.fillStyle = '#444';
          }
          var percent = String(Math.round(dataset.data[i]/total*100)) + "%";
          ctx.fillText(dataset.data[i], model.x + x, model.y + y);
          // Display percent in another line, line break doesn't work for fillText
          ctx.fillText(percent, model.x + x, model.y + y + 15);
        }
      });               
    }
  }
};

var numberGenes = 0;
var numberDiseases = 0;
var numberProteins = 0;
var numberGoAnnotations = 0;
  // Fetch number of genes
  var service = new imjs.Service({
         root: 'http://www.humanmine.org/humanmine/service'
  });
  
  var query = {
    "from": "Gene",
    "select": ["primaryIdentifier"]
  };
  
  service.count(query).then(function(response) {
    numberGenes = response;
	  // Fetch number of proteins
  var service = new imjs.Service({
         root: 'http://www.humanmine.org/humanmine/service'
  });
  
  var query = {
    "from": "Protein",
    "select": ["primaryIdentifier"]
  };
  
  service.count(query).then(function(response) {
    numberProteins = response;
	var myPieChart = new Chart(ctx, {
  type: 'pie',
  data: {
    labels: ["Genes", "Proteins"],
    datasets: [{
      data: [numberGenes, numberProteins],
      backgroundColor: ['#007bff', '#ffc107'],
    }],
  },
  options: pieOptions
});
  });
  });
  //
  
  //

