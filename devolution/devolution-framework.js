"use strict";

/* Copyright 2015 The Blyth Institute */
/* See LICENSE file for terms of use */

function Environment() {

}
Environment.prototype.mutation_rate = 0.05;
Environment.prototype.deletion_mutation_rate = 0.1; // only if mutation_rate is hit
Environment.prototype.insertion_mutation_rate = 0.02; // only if mutation_rate is NOT hit
Environment.prototype.allow_numeric_terminals = false;
Environment.prototype.min_numeric_terminal = 0;
Environment.prototype.max_numeric_terminal = 10;
Environment.prototype.max_initial_leaves = 10;
Environment.prototype.branch_weight = 1;
Environment.prototype.number_weight = 1;
Environment.prototype.num_organisms_to_select = 10;
Environment.prototype.instruction_weights = null;
Environment.prototype.previous_generations = null;
Environment.prototype.keep_fittest_organisms_from_previous_generation = true;
Environment.prototype.keep_previous_generations = false;
Environment.prototype.num_organisms_to_evolve_per_selected_organism = 2;
Environment.prototype.training_set = []; // Each member is an array of input/output pairs
Environment.prototype.organisms = null;
Environment.prototype.evolve = function(opts) {
	opts = opts || {};
	var num_generations = opts.generations || 2;
	var gen_cb = opts.generation_callback;

	if(this.organisms == null) {
		this.generateInitialOrganisms(2);
	}

	this.evaluateGeneration(opts);
	for(var i = 0; i < num_generations; i++) {
		this.evolveGeneration(opts);
		this.evaluateGeneration(opts);
		if(gen_cb) {
			gen_cb(this);
		}
	}
};

Environment.prototype.generateSubtree = function() {
	var program = [];
	var env = this;

	var generate_func = function(curset) {
		var optype = Math.floor(Math.random() * 3);
		while(optype != 2) {
			if(optype == 0) {
				var inst = env.instruction_set.pickNewInstruction();
				curset.push(inst);
			} else if(optype == 1) {
				var inst = [];
				generate_func(inst);
				curset.push(inst);
			}
			optype = Math.floor(Math.random() * 3);
		}
	}
	generate_func(program);	
	return program;
};

Environment.prototype.generateOrganism = function() {
	var o = new Organism();
	o.program = this.generateSubtree();

	return o;
};
Environment.prototype.generateInitialOrganisms = function(num) {
	var orglist = [];
	for(var i = 0; i < num; i++) {
		orglist.push(this.generateOrganism());
	}
	this.organisms = orglist;
};
Environment.prototype.evolveGeneration = function(opts) {
	var next_gen_templates = this.findOrganismsToEvolve(opts);
	console.log(next_gen_templates);
	var next_gen = [];
	for(var i = 0; i < next_gen_templates.length; i++) {
		var o = next_gen_templates[i];
		var evo_set = this.evolveChildren(o);
		if(this.keep_fittest_organisms_from_previous_generation) {
			evo_set.push(o);
		}
		next_gen = next_gen.concat(evo_set);
	}
	if(this.keep_previous_generations) {
		if(this.freezer == null) {
			this.previous_generations = [];
		}
		this.previous_generations.push(this.organisms);
	}
	this.organisms = next_gen;
}
Environment.prototype.copySubtreeMutating = function(subtree) {
	if(subtree == null) {
		console.log("ISSUE - null subtree");
		return this.generateSubtree();
	}
	var new_subtree = [];
	for(var i = 0; i < subtree.length; i++) {
		if(Math.random() < this.mutation_rate) {
			if(Math.random() < this.deletion_mutation_rate) {
				// Nothing - we are deleting this node
			} else {
				new_subtree.push(this.generateSubtree());
			}
		} else {
			var elem = subtree[i];
			if(Array.isArray(elem)) {
				elem = this.copySubtreeMutating(elem)
			}
			new_subtree.push(elem);
		}
		if(Math.random() < this.insertion_mutation_rate) {
			new_subtree.push(this.generateSubtree());
		}
	}

	return new_subtree;
};
Environment.prototype.evolveChildren = function(organism, num_children) {
	if(num_children == null) {
		num_children = this.num_organisms_to_evolve_per_selected_organism;
	}	
	var children = [];

	for(var i = 0; i < num_children; i++) {
		var o = new Organism();
		o.program = this.copySubtreeMutating(organism.program);
		children.push(o);
	}

	return children;
};
Environment.prototype.retrieveBestOrganism = function() {
	var best_o = null;
	for(var i = 0; i < this.organisms.length; i++) {
		var o = this.organisms[i];
		console.log(o);
		if(o.fitness != null) {
			if(best_o == null) {
				best_o = o;
			} else {
				if(o.fitness > best_o.fitness) {
					best_o = o;
				}
			}
		}
	}

	return best_o;
};
Environment.prototype.findOrganismsToEvolve = function(opts) {
	return this.findFittestOrganisms(this.num_organisms_to_select);
};
Environment.prototype.findFittestOrganisms = function(num_orgs) {
	var new_orgs = this.organisms.filter(function(o) { return o.fitness != null });
	new_orgs = new_orgs.sort(function(a, b) { return b.fitness - a.fitness; });
	console.log("GENERATION");
	for(var i = 0; i < new_orgs.length; i++) {
		console.log(new_orgs[i]);
	}
	return new_orgs.slice(0, num_orgs);
};
Environment.prototype.evaluateGeneration = function(opts) {
	for(var i = 0; i < this.organisms.length; i++) {
		var o = this.organisms[i];
		o.fitness = this.evaluateFitness(o);
	}
};
Environment.prototype.evaluateFitness = function(o) { // -RMS fitness by default
	var total_fitness = 0;
	var trials = this.training_set.length;;
	for(var i = 0; i < this.training_set.length; i++) {
		var training_data = this.training_set[i];
		var training_params = training_data[0];
		var training_result = training_data[1];
		o.run_program(training_params, this);
		// console.log([training_params, training_result, o.result]);
		var diff = o.result - training_result;
		total_fitness = total_fitness + (diff * diff);
	}
	var avg_fitness = total_fitness / trials;
	avg_fitness = Math.sqrt(avg_fitness);
	return 0 - avg_fitness;
};
Environment.prototype.generateSimpleTrainingSet = function(start, end, func) {
	var tset = [];
	for(var i = start; i <= end; i++) {
		var val = func(i);
		tset.push([[i], val]);
	}
	this.training_set = tset;
}

function Program() {

}

function Organism() {
}
Organism.prototype.parent_organism = null;
Organism.prototype.program = [];
Organism.prototype.fitness = null;
Organism.prototype.exception_message = null;
Organism.prototype.parameters = null;
Organism.prototype.reset = function() {
	this.exception_message = null;
};
Organism.prototype.raiseException = function(msg) {
	if(this.exception_message == null) { // Only record the first exception - the others are probably related
		this.exception_message = msg;
	}
	this.fitness = null;
};
Organism.prototype.evaluateInstructionNodes = function(nodes, env) {
	var results = [];
	for(var i = 0; i < nodes.length; i++) {
		results.push(this.evaluateInstructionNode(nodes[i]));
	}
	return results[0] || 0;
};
Organism.prototype.evaluateInstructionNode = function(node, env) {
	if(typeof(node) == "number") {
		return node;
	}
	if(Instruction.isInstruction(node)) {
		return node.perform(this, [], env);
	}
	if(!Array.isArray(node)) {
		this.raiseException("Invalid instruction node");
		return 0;
	}
	if(node.length == 0) {
		return 0;
	}
	
	// Otherwise, this is a tree
	var inst = node[0];
	var args = node.slice(1);

	// Empty trees evaluate to zero
	if(inst == null) {
		return 0;
	}

	// If the instruction node is a subtree, evaluate it first
	while(Array.isArray(inst)) {
		inst = this.evaluateInstructionNode(inst, env);
	}

	// Trees without instructions get evaluated as a list and the first node returned
	if(!Instruction.isInstruction(inst)) {
		return inst;
	} else {
		return inst.perform(this, args || [], env);	
	}
};
Organism.prototype.run_program = function(params, env) {
	this.reset();
	this.parameters = params;
	this.result = this.evaluateInstructionNode(this.program);
	return this.result;
};


// FIXME - include weights
function InstructionSet(instruction_codes) {
	if(instruction_codes == null) {
		this.instructions = InstructionSet.available_instructions;
	} else {
		this.instructions = [];
		for(var i = 0; i < instruction_codes.length; i++) {
			var inst_code = instruction_codes[i];
			var inst = InstructionSet.instructions_by_code[inst_code];
			this.instructions.push(inst);
		}
	}
}
InstructionSet.prototype.instructions = null;
InstructionSet.prototype.instruction_weights = null;
InstructionSet.available_instructions = [];
InstructionSet.instructions_by_code = {}
InstructionSet.registerInstruction = function(i) {
	InstructionSet.available_instructions.push(i);
	InstructionSet.instructions_by_code[i.code] = i;
};
InstructionSet.prototype.pickNewInstruction = function() {
	return this.instructions[Math.floor(Math.random() * this.instructions.length)];
}

function Instruction(opts) {
	for(var key in opts) {
		this[key] = opts[key];
	}
}
Instruction.prototype.is_instruction = true;
Instruction.prototype.weight = 1;
Instruction.isInstruction = function(x) { if(x == null) { return false; } return x.is_instruction === true; };
Instruction.prototype.code = "invalid";
Instruction.prototype.perform = function(organism, args) { organism.raiseException("Invalid instruction"); };

