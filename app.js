M.AutoInit();

var headerData, fData;

//load data
d3.text("./data/noheader.csv", function(matrix_text) {
  fData = d3.csvParseRows(matrix_text);

  d3.text("./data/header.csv", function(header_text) {
    headerData = d3.csvParseRows(header_text);

    console.log(headerData, fData);

    init();
  });
});

/*
Init
*/
//Nodes
var nodes;
var links;

var headerArr;
var dataSize;

//chord data
var cData;

//color scale
var colorScale = d3.scaleOrdinal().range(d3.schemeCategory10);

//parents
var group = ["lh", "rh"];

var matrix_transform = d3.transform().scale(function(d) {
  console.log(d);
  return 1.05;
});

var chord_transform = d3.transform().translate(function(d) {
  return [100, 100];
});

var selected_target;
var selected_source;

var link_conn;
var node_conn;

function init() {
  nodes = [];
  links = [];

  cData = [];

  headerArr = headerData[0];
  dataSize = headerArr.length;

  generateNode();

  generateLink();

  drawMatrix();

  generateDataForChord();

  drawChord();

  drawWordCloud();
}

function generateNode() {
  for (var i = 0; i < headerArr.length; i++) {
    var node = {};

    node.index = i;
    node.name = headerArr[i];

    if (headerArr[i].indexOf("lh") == 0) {
      node.group = 1;
    } else if (headerArr[i].indexOf("rh") == 0) {
      node.group = 2;
    } else {
      node.group = 3;
    }
    nodes.push(node);
  }
}

function generateLink() {
  for (var i = 0; i < fData.length; i++) {
    for (var j = 0; j < fData[i].length; j++) {
      if (fData[i][j] == 0) {
        continue;
      }

      var link = {};

      link.source = i;
      link.target = j;
      link.value = fData[i][j];

      links.push(link);
    }
  }
}

var drawMatrix = function() {
  var matrixLayout = d3.adjacencyMatrixLayout();

  matrixLayout
    .size([1800, 1800])
    .nodes(nodes)
    .links(links)
    .directed(true)
    .nodeID(function(d) {
      return d.name;
    })
    .edgeWeight(function(d) {
      return d.value;
    });

  var matrixData = matrixLayout();

  d3
    .select("svg#matrix")
    .append("g")
    .attr("transform", "translate(80,80)")
    .attr("id", "adjacencyG")
    .selectAll("rect")
    .data(matrixData)
    .enter()
    .append("rect")
    .attr("id", function(d, i) {
      return "block" + i;
    })
    .attr("class", function(d, i) {
      return "blocks " + d.source.name + " " + d.target.name;
    })
    .attr("width", function(d) {
      return d.width;
    })
    .attr("height", function(d) {
      return d.height;
    })
    .attr("x", function(d) {
      return d.x;
    })
    .attr("y", function(d) {
      return d.y;
    })
    .attr("stroke", "black")
    .attr("stroke-width", "1px")
    .attr("fill", function(d) {
      return colorScale(d.source.group);
    })
    .attr("fill-opacity", function(d) {
      return Math.abs(d.weight * 0.8);
    });
  //        .attr('transform', matrix_transform);

  d3
    .selectAll(".blocks")
    .on("mouseover", function(d, i) {
      d3.select("#target_text").text(d.target.name);

      d3.select("#source_text").text(d.source.name);

      d3.select("#weight_value").text(d.weight);

      var res1 = i % dataSize;
      var res2 = Math.floor(i / dataSize);

      d3
        .selectAll(".blocks")
        .filter(function(dt, index) {
          return (
            (index % dataSize == res1 && Math.floor(index / dataSize) < res2) ||
            (Math.floor(index / dataSize) == res2 && index % dataSize < res1)
          );
        })
        .classed("highlight-block", true);
      d3.select(this).classed("highlight-block-focus", true);

      // link
      d3
        .select("path." + d.target.name + "." + d.source.name)
        .classed("link--target", true)
        .raise();

      //link Node
      d3.select(".node." + d.target.name).classed("node-highlight", true);

      d3.select(".node." + d.source.name).classed("node-highlight", true);

      //word cloud
      d3.select("rect.worditem." + d.target.name).attr("fill", "yellow");

      d3.select("rect.worditem." + d.source.name).attr("fill", "yellow");
    })
    .on("mouseout", function(d, i) {
      d3.selectAll("rect.blocks").classed("highlight-block", false);

      d3.select(this).classed("highlight-block-focus", false);

      //link
      d3
        .select("path." + d.target.name + "." + d.source.name)
        .classed("link--target", false);

      d3.selectAll("path.link").classed("disappear", false);

      //link Node
      d3.select(".node." + d.target.name).classed("node-highlight", false);

      d3.select(".node." + d.source.name).classed("node-highlight", false);

      //word cloud
      d3.select("rect.worditem." + d.target.name).attr("fill", function(d, i) {
        if (d.indexOf("lh")) {
          return "#ff7f0e";
        } else {
          return "#1f77b4";
        }
      });

      d3.select("rect.worditem." + d.source.name).attr("fill", function(d, i) {
        if (d.indexOf("lh")) {
          return "#ff7f0e";
        } else {
          return "#1f77b4";
        }
      });
    });

  d3.select("#adjacencyG").call(matrixLayout.xAxis);

  d3.select("#adjacencyG").call(matrixLayout.yAxis);
};

var generateDataForChord = function() {
  for (var i = 0; i < headerArr.length; i++) {
    var item = {};
    var importList = [];

    for (var j = i + 1; j < fData[i].length; j++) {
      if (fData[i][j] > 0) {
        importList.push(headerArr[j]);
      }
    }

    item.name = headerArr[i];
    item.imports = importList;
    item.size = fData[i][j];

    cData.push(item);
  }

  //    console.log(cData);
};

var drawChord = function() {
  var diameter = 960;
  var radius = diameter / 2;
  var innerRadius = radius - 120;

  var arcData = [];
  var arcGenerator;
  var arcScale;

  var root;
  var sum;

  var cluster = d3.cluster().size([360, innerRadius]);

  var line = d3
    .radialLine()
    .curve(d3.curveBundle.beta(0.85))
    .radius(function(d) {
      return d.y;
    })
    .angle(function(d) {
      return d.x / 180 * Math.PI;
    });

  var svg = d3.select("svg#connectivity");

  var arcG = svg
    .append("g")
    .attr("class", "arcGroup")
    .attr("transform", "translate(" + radius * 1.2 + "," + radius * 1.2 + ")");

  // var subG = svg.append("g").attr("class", "subGroup");

  // var text = svg
  //   .append("text")
  //   .attr("x", -50)
  //   .attr("y", 0)
  //   .attr("font-size", 15)
  //   .attr("font-family", "simsun");

  link_conn = svg
    .append("g")
    .attr("id", "link_conn")
    .attr("transform", "translate(" + radius * 1.2 + "," + radius * 1.2 + ")");

  node_conn = svg
    .append("g")
    .attr("id", "node_conn")
    .attr("transform", "translate(" + radius * 1.2 + "," + radius * 1.2 + ")");

  var createAngleData = function() {
    //add arc data into the arrray
    for (var i = 0; i < 2; i++) {
      arcData.push({
        startAngle: Math.PI * i,
        endAngle: Math.PI * (i + 1)
      });
    }
    //        console.log(arcData);
  };

  var drawArc = function() {
    createAngleData();

    arcGenerator = d3
      .arc()
      .innerRadius(radius - 110)
      .outerRadius(radius - 90)
      .padAngle(0.05)
      .padRadius(200);

    arcG
      .selectAll("path")
      .data(arcData)
      .enter()
      .append("path")
      .attr("d", arcGenerator)
      .attr("id", function(d, i) {
        return "arc" + i;
      })
      .attr("class", "arc_cluster")
      .attr("fill", function(d, i) {
        return colorScale(i + 1);
      });
  };

  var draw = function() {
    root = packageHierarchy(cData).sum(function(d) {
      return d.size;
    });

    cluster(root);

    //        console.log(root);
    //        console.log(packageImports(root.leaves()))

    link_conn = link_conn
      .selectAll(".link")
      .data(packageImports(root.leaves()))
      .enter()
      .append("path")
      .each(function(d) {
        // console.log(d);
        (d.source = d[0]), (d.target = d[d.length - 1]);
      })
      .attr("class", function(d, i) {
        //                console.log(d);
        return "link " + d.source.data.name + " " + d.target.data.name;
      })
      .attr("d", line)
      .attr("style", function(d, i) {
        var res1 = Math.floor(i / headerArr.length);
        var res2 = i % headerArr.length;
        return "opacity:" + fData[res1][res2] * 0.5;
      });

    d3
      .selectAll(".link")
      .on("mouseover", function(d, i) {
        console.log(d, i);
      })
      .on("mouseout", function(d, i) {
        console.log(d, i);
      });

    node_conn = node_conn
      .selectAll(".node")
      .data(root.leaves())
      .enter()
      .append("text")
      .attr("class", function(d, i) {
        return d.data.name;
      })
      // .attr("dy", "0.30em")
      .attr("transform", function(d) {
        return (
          "rotate(" +
          (d.x - 90) +
          ")translate(" +
          (d.y + 40) +
          ", 0)" +
          (d.x < 180 ? "" : "rotate(180)")
        );
      })
      .attr("text-anchor", function(d) {
        return d.x < 180 ? "start" : "end";
      })
      .attr("font-size", 12)
      .text(function(d) {
        return d.data.name;
      })
      .on("mouseover", textMouseovered)
      .on("mouseout", textMouseouted);

    drawArc();
  };

  var textMouseovered = function(d) {
    // console.log(d);

    var list = d.data.imports;

    link_conn
      .filter(function(l) {
        return l.target === d || l.source === d;
      })
      .classed("link--target", true)
      .raise();

    link_conn
      .filter(function(l) {
        return l.target !== d && l.source !== d;
      })
      .classed("disappear", true);

    //block
    d3.selectAll("rect.blocks." + d.data.name).classed("highlight-block", true);

    //word cloud
    d3.select("rect.worditem." + d.data.name).attr("fill", "yellow");
  };

  var textMouseouted = function(d) {
    link_conn
      .classed("link--target", false)
      .classed("link--source", false)
      .classed("disappear", false)
      .attr("style", function(d, i) {
        var res1 = Math.floor(i / headerArr.length);
        var res2 = i % headerArr.length;
        return "opacity:" + fData[res1][res2] * 0.5;
      });

    node_conn.classed("node--target", false).classed("node--source", false);

    //block
    d3
      .selectAll("rect.blocks." + d.data.name)
      .classed("highlight-block", false);

    // word cloud
    d3.select("rect.worditem." + d.data.name).attr("fill", function(d, i) {
      if (d.indexOf("lh")) {
        return "#ff7f0e";
      } else {
        return "#1f77b4";
      }
    });
  };

  draw();
};

// Return a list of imports for the given array of nodes.
var packageImports = function(nodes) {
  var map = {},
    imports = [];

  // Compute a map from name to node.
  nodes.forEach(function(d) {
    map[d.data.name] = d;
  });

  // For each import, construct a link from the source to target node.
  nodes.forEach(function(d) {
    if (d.data.imports)
      d.data.imports.forEach(function(i) {
        imports.push(map[d.data.name].path(map[i]));
      });
  });

  return imports;
};

var packageHierarchy = function(data) {
  var map = {};

  function find(name, data) {
    var node = map[name],
      i;
    if (!node) {
      node = map[name] = data || {
        name: name,
        children: []
      };
      if (name.length) {
        node.parent = find(name.substring(0, (i = name.lastIndexOf("."))));
        node.parent.children.push(node);
        node.key = name.substring(i + 1);
      }
    }
    return node;
  }

  data.forEach(function(d) {
    find(d.name, d);
  });

  return d3.hierarchy(map[""]);
};

var filter_1 = function() {
  d3.selectAll(".link").attr("style", function(d, i) {
    var res1 = Math.floor(i / headerArr.length);
    var res2 = i % headerArr.length;
    return "opacity:" + fData[res1][res2] * 0.5;
  });

  d3.selectAll(".blocks").attr("fill-opacity", function(d) {
    // console.log(d);
    return d.weight * 0.8;
  });

  var value = document.querySelector("#filter1").value;

  d3
    .selectAll(".blocks")
    .filter(function(dt, index) {
      return dt.weight < value;
    })
    .attr("fill-opacity", 0);

  d3
    .selectAll(".link")
    .filter(function(dt, index) {
      var res1 = Math.floor(index / headerArr.length);
      var res2 = index % headerArr.length;
      return fData[res1][res2] < value;
    })
    .each(function(d) {
      console.log(d);
    })
    .attr("style", "opacity: 0");
};

var drawWordCloud = function() {
  var li_item_target = d3
    .select("#target_dropdown")
    .selectAll("li")
    .data(headerArr)
    .enter()
    .append("li")
    .on("click", function(d) {
      selected_target = d;

      if (selected_source != null && selected_target != null) {
        selected_specific_block();
      }
    });

  var li_item_source = d3
    .select("#source_dropdown")
    .selectAll("li")
    .data(headerArr)
    .enter()
    .append("li")
    .on("click", function(d) {
      selected_source = d;

      if (selected_source != null && selected_target != null) {
        selected_specific_block();
      }
    });

  li_item_target
    .append("a")
    .attr("href", "#!")
    .text(function(d) {
      return d;
    });

  li_item_source
    .append("a")
    .attr("href", "#!")
    .text(function(d) {
      return d;
    });

  d3
    .select("#source_dropdown")
    .selectAll("li")
    .on("mouseover", function(d, i) {
      //block
      d3.selectAll("rect.blocks." + d).classed("highlight-block", true);
      //word cloud
      d3.select("rect.worditem." + d).attr("fill", "yellow");
      //link
      d3
        .selectAll("path." + d)
        .classed("link--target", true)
        .raise();
      //link Node
      d3.select(".node." + d).classed("node-highlight", true);
    })
    .on("mouseout", function(d, i) {
      //block
      d3.selectAll("rect.blocks").classed("highlight-block", false);
      //word cloud
      d3.select("rect.worditem." + d).attr("fill", function(d, i) {
        if (d.indexOf("lh")) {
          return "#ff7f0e";
        } else {
          return "#1f77b4";
        }
      });
      //link
      d3.selectAll("path").classed("link--target", false);

      d3.selectAll("path.link").classed("disappear", false);
      //link Node
      d3.selectAll(".node." + d).classed("node-highlight", false);
    });

  d3.select("#connectivity").attr("transform", chord_transform);
};

var selected_specific_block = function() {
  //clear previous selected
  d3.selectAll("rect.blocks").classed("menu_selected_block", false);

  d3.selectAll("text").classed("selected_conn_text", false);

  d3.selectAll("path.link").classed("selected_conn_link", false);

  //matrix
  d3
    .select("#matrix")
    .select(`.${selected_target}.${selected_source}`)
    .classed("menu_selected_block", true);

  //chord
  d3
    .select(`path.${selected_target}.${selected_source}`)
    .classed("selected_conn_link", true)
    .raise();

  d3.select(`text.${selected_source}`).classed("selected_conn_text", true);

  d3.select(`text.${selected_target}`).classed("selected_conn_text", true);
};

//filter
d3.select("#filter1").on("change", filter_1);
