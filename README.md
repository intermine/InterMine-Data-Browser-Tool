# InterMine Data Browser
<p align="left">Build Status (Travis CI): <a href="https://travis-ci.org/AdrianBZG/InterMine-Data-Browser-Tool"><img src="https://travis-ci.org/AdrianBZG/InterMine-Data-Browser-Tool.svg?branch=master"></a><br>
<p align="left"><img src="https://badges.frapsoft.com/os/v1/open-source.png?v=103"> <a href="LICENSE"><img src="https://img.shields.io/badge/License-LGPL%202.1-blue.svg"></a> <img src="https://img.shields.io/david/strongloop/express.svg"></p>

The goal of this project is to implement a faceted search tool to display the data from InterMine database, allowing the users to search easily within the different mines available around InterMine without the requirement of having an extensive knowledge of the data model.

For the project organization, please refer to [InterMine](https://github.com/intermine)

_Please note that the development is very early on and the project is not ready to use yet._

## DEPLOYMENT

Try it out with the Heroku deployment [here](http://im-browser-prototype.herokuapp.com/) (automatic deployment, may have some delay)

## GETTING STARTED

Please visit [Getting Started](getting-started.md)

## DEPENDENCIES

Check [package.json file](package.json)

## DOCUMENTATION

Apart from the in-line comments in the code, documentation generated with _documentation.js_ can be accessed [here](https://adrianbzg.github.io/InterMine-Data-Browser-Tool/). To update the documentation, the 'gulp documentation' is available.

## REQUIRED ONTOLOGY CONCEPTS (PER MINE) FOR EACH FILTER

|        Filter        |                                                                                 Ontology concepts                                                                                |
|:--------------------:|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
|     GO Annotation    |                                                                          goAnnotation.ontologyTerm.name                                                                          |
|     Dataset Name     |                                                                                   dataSets.name                                                                                  |
|     Pathway Name     |                                                                                   pathways.name                                                                                  |
|  Organism short name |                                                                              Gene.organism.shortName                                                                             |
|       Location       |                                                      locations.start + locations.end + locations.locatedOn.primaryIdentifier                                                     |
|    Diseases (OMIM)   |                                                                                   diseases.name                                                                                  |
|        ClinVar       |                                                                    alleles.clinicalSignificance + alleles.type                                                                   |
| Protein Localisation | proteinAtlasExpression.cellType + proteinAtlasExpression.tissue.name + proteinAtlasExpression.expressionType + proteinAtlasExpression.level + proteinAtlasExpression.reliability |
|  Protein Domain Name |                                                                 proteins.proteinDomainRegions.proteinDomain.name                                                                 |
|     Interactions     |                                         interactions.participant2.symbol + interactions.details.type + interactions.details.dataSets.name                                        |
|      Expression      |                                 atlasExpression.pValue + atlasExpression.tStatistic + atlasExpression.expression + atlasExpression.dataSets.name                                 |

## CONTRIBUTING GUIDELINES

1. Find a thing to fix/implement in [Issues](https://github.com/AdrianBZG/InterMine-Data-Browser-Tool/issues?direction=desc&sort=created&state=open) or come up with your own idea, [create a discussion issue](https://github.com/AdrianBZG/InterMine-Data-Browser-Tool/issues/new) for it and get a feedback.

2. [Fork](https://help.github.com/articles/fork-a-repo) the repository.

3. Create your new feature branch.

   ``` bash
   git checkout -b my-new-feature
   ```
   
4. Commit your changes.

   ``` bash
   git commit -am 'Add some feature
   ```
   
5. Push to the newly created feature branch.

   ``` bash
   git push origin my-new-feature
   ```
   
6. Create a new [Pull Request](https://help.github.com/articles/using-pull-requests)

## CONTACT

You can contact the developers by opening a new issue in this repository [here](https://github.com/AdrianBZG/InterMine-Data-Browser-Tool/issues/new).

## SCREENSHOTS

Searching in HumanMine (Release 1.1.0)<br>
<div style="text-align:center"><img src ="https://i.imgur.com/qdU3oiu.png" /></div>

Searching in HumanMine for Alzheimer disease (Release 1.1.0)<br>
<div style="text-align:center"><img src ="https://i.imgur.com/gP97sDM.png" /></div>

Searching in FlyMine (Release 1.1.0)<br>
<div style="text-align:center"><img src ="https://i.imgur.com/4dgqXLl.png" /></div>

Searching in HymenopteraMine (Release 1.1.0)<br>
<div style="text-align:center"><img src ="https://i.imgur.com/Duhsj3P.png" /></div>