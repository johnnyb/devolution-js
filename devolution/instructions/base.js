"use strict";

/* Copyright 2015 The Blyth Institute */
/* See LICENSE file for terms of use */

InstructionSet.registerInstruction(new Instruction({
	code: "one",
	perform: function(organism, args) {
		args = organism.evaluateInstructionNodes(args);
		return 1;
	}
}));

InstructionSet.registerInstruction(new Instruction({
	code: "zero",
	perform: function(organism, args) {
		args = organism.evaluateInstructionNodes(args);
		return 0;
	}
}));

InstructionSet.registerInstruction(new Instruction({
	code: "param",
	perform: function(organism, args) {
		args = organism.evaluateInstructionNodes(args);
		var idx = args[0] || 0;
		if(organism.parameters.length > 0) {
			param_index = args[0] % organism.parameters.length;
			return organism.parameters[param_index];
		} else {
			return 0;
		}
	}
}));

InstructionSet.registerInstruction(new Instruction({
	code: "add",
	perform: function(organism, args, env) {
		args = organism.evaluateInstructionNodes(args);
		var final_val = 0;
		for(var i = 0; i < args.length; i++) {
			final_val = final_val + args[i];
		}

		return final_val;
	}
}));

InstructionSet.registerInstruction(new Instruction({
	code: "sub",
	perform: function(organism, args, env) {
		args = organism.evaluateInstructionNodes(args);
		var final_val = args[0];
		for(var i = 1; i < args.length; i++) {
			final_val = final_val - args[i];
		}

		if(final_val == null) {
			final_val = 0;
		}

		return final_val;
	}
}));

InstructionSet.registerInstruction(new Instruction({
	code: "mult",
	perform: function(organism, args, env) {
		args = organism.evaluateInstructionNodes(args);
		var final_val = 1;
		for(var i = 0; i < args.length; i++) {
			final_val = final_val * args[i];
		}
		return final_val;
	}
}));

InstructionSet.registerInstruction(new Instruction({
	code: "div",
	perform: function(organism, args, env) {
		args = organism.evaluateInstructionNodes(args);
		var final_val = args[0];
		for(var i = 1; i < args.length; i++) {
			final_val = final_val / args[i];
		}
		return final_val;
	}
}));
