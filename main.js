const express = require('express');
const ip = require('ip');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 4200

app.use(express.static(path.join(__dirname, "")))
 
app.set("view engine", "ejs")
app.engine('ejs', require('ejs').__express);
app.set("views", path.join(__dirname, ""))


class GeneticAlgorithm {
    constructor(totalCities, populationSize, mutationRate, tournamentSize, elitismCount, generations, crossoverRate) {
        this.totalCities = totalCities;
        this.populationSize = populationSize;
        this.mutationRate = mutationRate;
        this.tournamentSize = tournamentSize;
        this.elitismCount = elitismCount;
        this.generations = generations;
        this.crossoverRate = crossoverRate
        this.population = [];
        this.recordDis = Infinity;
        this.bestEver;
        this.currentBest;
        this.fitnessValue = new Array(this.populationSize).fill(0)
        this.cities = cities;   
        this.fitness = [];
        this.iterationBestFitness = [];
        this.iterationWorstFitness = [];
        this.iterationMedianFitness = [];
        this.cities = cities;
        this.sortFitness = [];
        this.newPop = [];
        
    }
    // read .tsp file
    static parseTSPFile(filename) {
        const data = fs.readFileSync(filename, 'utf8');
        const lines = data.split('\n');
        const cities = [];

        // Start reading from NODE_COORD_SECTION
        let startReading = false;
        for (let line of lines) {
            if (line.trim() === "NODE_COORD_SECTION") {
                startReading = true;
                continue;
            }
            if (startReading && line.trim() !== "") {
                const [cityId, x, y] = line.trim().split(/\s+/);
                cities.push({ id: parseInt(cityId), x: parseFloat(x), y: parseFloat(y) });
            }
        }
        return cities;
    }
    
    //calculate the distance between two cities
    calculateDis(cityA, cityB) {
        const dx = cityB.x - cityA.x;
        const dy = cityB.y - cityA.y;
        let cityDistance= Math.sqrt(dx * dx + dy * dy)
        //console.log('city distance',cityDistance)
        return cityDistance
    }

    //calculate the distance between all cities
    calculateTotalDis(route) {
        let totalDis = 0;
              
        for (let i = 0; i < route.length - 1; i++) {
            let cityA = this.cities[route[i]];
            let cityB = this.cities[route[i + 1]];
            totalDis += this.calculateDis(cityA, cityB);
        }

        // Add distance between the last city and the first city
        let lastCity = this.cities[route[route.length - 1]];
        let firstCity = this.cities[route[0]];
        totalDis += this.calculateDis(lastCity, firstCity);  
        //console.log(route) 
        //console.log('total dis',totalDis)   
       
        return totalDis
    }


////////////// i am not sure about this part 
    // draw route between cities
    drawPath(ctx) {
        if (ctx) {
            ctx.beginPath();
            for (let i = 0; i < this.bestEver.length - 1; i++) {
                let cityA = this.cities[this.bestEver[i]];
                let cityB = this.cities[this.bestEver[i + 1]];
                ctx.moveTo(cityA.x, cityA.y);
                ctx.lineTo(cityB.x, cityB.y);
            }
            ctx.closePath();
            ctx.stroke();
        } else {
            console.error("Canvas context is undefined");
        }
    }
    
    
   
  
    // to shuffle cities
    shuffleList(individual) {
        for (let i = individual.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i));
            const temp = individual[i];
            individual[i] = individual[j];
            individual[j] = temp;
        }
        //console.log('shuffle list', individual)
        return individual;
    }
    

    initialPopulation() {
        const iniPop = []
        this.population = []
        for (let i = 0; i < this.populationSize; i++) {
            const solution = [...Array(this.cities.length).keys()];
            iniPop.push(this.shuffleList(solution))
        }
        this.population = iniPop
        //console.log('initial population : ',this.population)
        return this.population
        
    }


    calculateFitness() {
        
        this.fitness = [];
 
        for (let i = 0; i < this.population.length; i++) {
            const newDis = this.calculateTotalDis(this.population[i]);
            this.fitness.push(newDis)
            if (newDis < this.recordDis) {
                this.recordDis = newDis;
                this.bestEver = this.population[i];
            }
            
        }
        /*console.log('best ever population : ',this.bestEver)
        console.log('fitness',this.fitness)
*/
        for (let i = 0; i < this.fitness.length - 1; i++)
        {
            for (let j = 0; j < this.fitness.length - 1; j++)
            {
                if (this.fitness[j] > this.fitness[j + 1])
                {
                    const tempF = JSON.parse(JSON.stringify(this.fitness[j]))
                    this.fitness[j] =  JSON.parse(JSON.stringify(this.fitness[j + 1]))
                    this.fitness[j + 1] = JSON.parse(JSON.stringify(tempF))

                    const tempP = JSON.parse(JSON.stringify(this.population[j]))
                    this.population[j] =  JSON.parse(JSON.stringify(this.population[j + 1]))
                    this.population[j + 1] = JSON.parse(JSON.stringify(tempP))
                }
            }
        }
        /*console.log('fitnes sort' , this.fitness)
        console.log('population sort', this.population)*/
        const fitBest = Math.floor(this.fitness[0]);
        const firWorst = Math.floor(this.fitness[this.fitness.length-1]);
        const fitMedian = Math.floor(this.fitness[this.fitness.length / 2]);

       
        // console.log('best',fitBest)
        // console.log('median', fitMedian)
        // console.log('worts' , firWorst)

        this.iterationBestFitness.push(fitBest);
        this.iterationMedianFitness.push(fitMedian);
        this.iterationWorstFitness.push(firWorst);
                
        return this.fitness
        
    }
    

    saveBestFitness(fileName) {
        const bestFit = this.iterationBestFitness.join('\n');
        fs.writeFileSync(fileName, bestFit);
    }

    saveMedianFitness(fileName) {
        const medianFit = this.iterationMedianFitness.join('\n');
        fs.writeFileSync(fileName, medianFit);
    }

    saveWorstFitness(fileName) {
        const worstFit = this.iterationWorstFitness.join('\n');
        fs.writeFileSync(fileName, worstFit);
    }



     selection() {
        let bestindex = 0;
        let bestFitnessValue = Infinity;
        
        for (let i = 0; i < this.tournamentSize; i++) {
            const randomindex = Math.floor(Math.random() * this.population.length);
            const fitnessValue = this.fitness[randomindex];
            if (fitnessValue < bestFitnessValue) {
                bestFitnessValue = fitnessValue;
                bestindex = randomindex;
            }
            
        }
        return this.population[bestindex].slice();
    }

  
    GA() {
        
        this.initialPopulation();
        this.calculateFitness();
        
        for (let generation = 1; generation <= this.generations; generation++) {
            this.newPop= [];

            // Add elitism to the new population
            for (let i = 0; i < this.elitismCount; i++) {
                this.newPop.push(this.population[i]); 
            }
           // console.log('elit pop ', this.newPop)

             if (this.elitismCount % 2 !== 0){
                 this.newPop.push(this.population[this.elitismCount])
             }
            //console.log('elit pop ', this.newPop)
            
            for (let i = this.elitismCount; i < this.populationSize -1; i += 2) {
                    
                const parentA = this.selection();
                const parentB = this.selection();
                
                let [offspringA, offspringB] = this.crossOver(parentA, parentB, this.crossoverRate);
                offspringA = this.mutate(offspringA);
                offspringB = this.mutate(offspringB); 
                
                this.newPop.push(offspringA);
                this.newPop.push(offspringB);
                   
                
            }
            this.population = this.newPop
            this.calculateFitness();
        }
        console.log("Best Ever Route: ", this.bestEver);
        console.log("Best Ever Distance: ", this.recordDis);
        console.log('population size', this.population.length)

        


    }
    

    crossOver(parentA, parentB, crossoverRate) {

        //return parent without crossover
        if (Math.random() > crossoverRate) {
            //console.log('not cross')
            return [parentA.slice(), parentB.slice()];
            
        }

        //create random cross over point
        const crossoverPoint = Math.floor(Math.random() * (parentA.length - 1)) +1;

        //create two offspring
        let offspringA = parentA.slice(0, crossoverPoint).concat(parentB.slice(crossoverPoint, parentA.length));
        let offspringB = parentB.slice(0, crossoverPoint).concat(parentA.slice(crossoverPoint, parentA.length));

       /* console.log('parentA: ',parentA);
        console.log('parentB: ',parentB);
        console.log();
        console.log('cross over', crossoverPoint)
        console.log('offA: ',offspringA);
        console.log('offB: ',offspringB);
        console.log();*/

        let misseGeneA = [];
        let misseGeneB = [];
        let duplicatedGeneA = [];
        let duplicatedGeneB = [];
    
        //check for missing point
        for (let i = 0; i < parentA.length; i++){
            if(!offspringA.includes(parentA[i])){
                misseGeneA.push(parentA[i])
            }
        }
        for (let i = 0; i < parentA.length; i++){
            if(!offspringB.includes(parentB[i])){
                misseGeneB.push(parentB[i])
            }
        }
       /* console.log('missA', misseGeneA);
        console.log('missB', misseGeneB);
        console.log()*/

        //check for duplicated point
        for (let i = 0; i < parentA.length-1; i++){
            for (let j = i+1; j < parentA.length; j++){
                if (offspringA[i] == offspringA[j]){
                    if (Math.floor(Math.random() * 2) == 0)
                    {
                        duplicatedGeneA.push(i);
                    }
                    else
                    {
                        duplicatedGeneA.push(j);
                    }
                }
            }
        }
        
        for (let i = 0; i < parentA.length-1; i++){
            for (let j = i+1; j < parentB.length; j++){
                if (offspringB[i] == offspringB[j]){
                    if (Math.floor(Math.random() * 2) == 0)
                    {
                        duplicatedGeneB.push(i);
                    }
                    else
                    {
                        duplicatedGeneB.push(j);
                    }
                }
            }
        }
  
        /*console.log(duplicatedGeneA);
        console.log(duplicatedGeneB);
        console.log()*/

        //replace random duplicated point with random missing one
        const len2 = misseGeneA.length
        for (let i = 0; i < len2; i++)
        {
            const rnd = Math.floor(Math.random() * (misseGeneA.length))
            const rnd2 = Math.floor(Math.random() * (duplicatedGeneA.length))
            
            offspringA[duplicatedGeneA[rnd2]] = misseGeneA[rnd];
            duplicatedGeneA.splice(rnd2,1)
            misseGeneA.splice(rnd,1)
        }
    

        const len3 = misseGeneB.length
        for (let i = 0; i < len3; i++)
        {
            const rnd3 = Math.floor(Math.random() * (misseGeneB.length))
            const rnd4 = Math.floor(Math.random() * (duplicatedGeneB.length))
            
            offspringB[duplicatedGeneB[rnd4]] = misseGeneB[rnd3];
            duplicatedGeneB.splice(rnd4,1)
            misseGeneB.splice(rnd3,1)
        }
        /*console.log(offspringA);
        console.log(offspringB);*/
        
        return [offspringA, offspringB];
    }

    mutate(chromosome) {
        const newChromosome = chromosome.slice();
       //for (let i = 0; i < chromosome.length; i++) {
            if (Math.random() < this.mutationRate) {
                const geneA = Math.floor(Math.random() * chromosome.length);
                const geneB = Math.floor(Math.random() * chromosome.length);
                // swap genes together
                const temp = newChromosome[geneA];
                newChromosome[geneA] = newChromosome[geneB];
                newChromosome[geneB] = temp;

            }
            /*else
            console.log('no mutation')
        
        /*console.log('chromosome',chromosome)
        console.log('new chromosome',newChromosome)*/
        return newChromosome
    }
    
}


//read file
const cities = GeneticAlgorithm.parseTSPFile('test5.tsp');

//totalCities,populationSize, mutationRate,tournamentSize, elitismCount , generations, crossoverRate)
const geneticAlgorithm = new GeneticAlgorithm(cities.length,50, 0.8,2, 4, 10, 0.8, cities);

    const startTime = new Date().getTime();
    geneticAlgorithm.GA( );
    const endTime = new Date().getTime();
    const duration = (endTime - startTime) / 1000;
    console.log(`Total Execution Time: ${duration } second`)
 



// Save the data to a CSV file

geneticAlgorithm.saveBestFitness('bestfitness.csv');
geneticAlgorithm.saveMedianFitness('Medianfitness.csv');
geneticAlgorithm.saveWorstFitness('worstfitness.csv');


////////////// i am not sure about this part 

app.get('/bd', (req,res)=>{
    let bb = geneticAlgorithm.recordDis; // Pass the best distance from geneticAlgorithm
    res.render(path.join(__dirname, "index.ejs"), {
        Bdistance: bb,
        time: duration, // Pass the duration time
    
    });
});




app.listen(port, console.log(`listening to port ${port}`))
