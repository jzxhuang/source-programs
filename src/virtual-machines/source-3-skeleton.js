/*
Included here:
* compiler S1- to sVML
* sVM implementation without memory management
* examples
*/

/* 

Compiler for language Source §1-

using virtual machine SVML1, Lecture Week 5 of CS4215

Instructions: press "Run" to evaluate an example expression
              (scroll down and un-comment one example)
              
The language Source §1- is defined as follows:

stmt    ::= expr ;
         |  const x = expr ;
         |  return expr ;
         |  stmt stmt ;

expr    ::= number
         |  true | false
         |  expr ? expr : expr
         |  expr && expr
         |  expr || expr
         |  expr binop expr
         |  unop expr
         |  expr ( expr (, expr)* )
         |  ( params ) => { stmt } ;
binop   ::= + | - | * | / | < | > | <= | >= | === | !==
unop    ::= !              
params  ::= ε | name ( , name ) . . .
*/

// SYNTAX OF SOURCE §1 

// Functions from SICP JS Section 4.1.2
// with slight modifications

function is_tagged_list(expr, the_tag) {
    return is_pair(expr) && head(expr) === the_tag;
}

// names are tagged with "name".

function is_name(stmt) {
    return is_tagged_list(stmt, "name");
}
function name_of_name(stmt) {
    return head(tail(stmt));
}

function is_self_evaluating(stmt) {
    return is_number(stmt) || is_boolean(stmt) || is_undefined(stmt);
}

function is_undefined_expression(stmt) {     
    return is_name(stmt) && name_of_name(stmt) === "undefined";
}

// constant declarations are tagged with "constant_declaration"
// and have "name" and "value" properties

function is_constant_declaration(stmt) {
   return is_tagged_list(stmt, "constant_declaration");
}
function constant_declaration_name(stmt) {
   return head(tail(head(tail(stmt))));
}
function constant_declaration_value(stmt) {
   return head(tail(tail(stmt)));
}

// variable declarations are tagged with "variable_declaration"
// and have "name" and "value" properties

function is_variable_declaration(stmt) {
   return is_tagged_list(stmt, "variable_declaration");
}
function variable_declaration_name(stmt) {
   return head(tail(head(tail(stmt))));
}
function variable_declaration_value(stmt) {
   return head(tail(tail(stmt)));
}

// assignments are tagged with "assignment"
// and have "name" and "value" properties

function is_assignment(stmt) {
   return is_tagged_list(stmt, "assignment");
}
function assignment_name(stmt) {
   return head(tail(head(tail(stmt))));
}
function assignment_value(stmt) {
   return head(tail(tail(stmt)));
}

// applications are tagged with "application"
// and have "operator" and "operands"

function is_application(expr) {
    return is_tagged_list(expr, "application");
}
// we distinguish primitive applications by their
// operator name

function is_primitive_application(expr) {
    return is_tagged_list(expr, "application") &&
        ! is_null(member(primitive_operator_name(expr), 
                         list("!", "+", "-", "*", "/", "===", 
                              "!==", "<", ">", "<=", ">=")));
}
function primitive_operator_name(expr) {
    return head(tail(head(tail(expr))));
}
function operator(expr) {
    return head(tail(expr));
}
function operands(expr) {
    return head(tail(tail(expr)));
}
function no_operands(ops) {
    return is_null(ops);
}
function first_operand(ops) {
    return head(ops);
}
function rest_operands(ops) {
    return tail(ops);
}

// boolean operations are tagged
// with "boolean_operation"

function is_boolean_operation(expr) {
    return is_tagged_list(expr, "boolean_operation");
}
function boolean_operator_name(expr) {
    return head(tail(head(tail(expr))));
}

// conditional expressions are tagged
// with "conditional_expression"

function is_conditional_expression(expr) {
    return is_tagged_list(expr, 
                "conditional_expression");
}
function cond_expr_pred(expr) {
    return list_ref(expr, 1);
}
function cond_expr_cons(expr) {
    return list_ref(expr, 2);
}
function cond_expr_alt(expr) {
    return list_ref(expr, 3);
}
function make_conditional_expression(expr1, expr2, expr3) {
    return list("conditional_expression",
                expr1, expr2, expr3);
}

function to_string(expr) {
    return (is_number(expr) || is_boolean(expr))
            ? stringify(expr)
            : length(operands(expr)) === 1
            ? "(" + operator(expr) + 
                    to_string(list_ref(operands(expr), 0)) + ")"
            : "(" + to_string(list_ref(operands(expr), 0)) + 
                    operator(expr) +  
                    to_string(list_ref(operands(expr), 1)) + ")";
}

// function definitions are tagged with "function_definition"
// have a list of "parameters" and a "body" statement

function is_function_definition(stmt) {
   return is_tagged_list(stmt, "function_definition");
}
function function_definition_parameters(stmt) {
   return head(tail(stmt));
}
function function_definition_body(stmt) {
   return head(tail(tail(stmt)));
}

// sequences of statements are just represented
// by tagged lists of statements by the parser.

function is_sequence(stmt) {
   return is_tagged_list(stmt, "sequence");
}
function make_sequence(stmts) {
   return list("sequence", stmts);
}
function sequence_statements(stmt) {   
   return head(tail(stmt));
}
function is_empty_sequence(stmts) {
   return is_null(stmts);
}
function is_last_statement(stmts) {
   return is_null(tail(stmts));
}
function first_statement(stmts) {
   return head(stmts);
}
function rest_statements(stmts) {
   return tail(stmts);
}

// functions return the value that results from
// evaluating their expression

function is_return_statement(stmt) {
   return is_tagged_list(stmt, "return_statement");
}
function return_statement_expression(stmt) {
   return head(tail(stmt));
}

// OP-CODES

// op-codes of machine instructions, used by compiler
// and machine

const START   =  0;
const LDCN    =  1; // followed by: number
const LDCB    =  2; // followed by: boolean
const LDCU    =  3; 
const PLUS    =  4; 
const MINUS   =  5; 
const TIMES   =  6; 
const EQUAL   =  7; 
const LESS    =  8; 
const GREATER =  9; 
const LEQ     = 10; 
const GEQ     = 11; 
const NOT     = 12; 
const DIV     = 13; 
const POP     = 14;
const ASSIGN  = 15; // followed by: index of value in environment
const JOF     = 16; // followed by: jump address
const GOTO    = 17; // followed by: jump address
const LDF     = 18; // followed by: max_stack_size, address, env extensn count
const CALL    = 19; 
const LD      = 20; // followed by: index of value in environment
const RTN     = 21;
const DONE    = 22; 

// some auxiliary constants
// to keep track of the inline data

const LDF_MAX_OS_SIZE_OFFSET = 1;
const LDF_ADDRESS_OFFSET = 2;
const LDF_ENV_EXTENSION_COUNT_OFFSET = 3;
const LDCN_VALUE_OFFSET = 1;
const LDCB_VALUE_OFFSET = 1;

// printing opcodes for debugging

const OPCODES = list(
    pair(START,   "START  "),
    pair(LDCN,    "LDCN   "),
    pair(LDCB,    "LDCB   "),
    pair(LDCU,    "LDCU   "),
    pair(PLUS,    "PLUS   "),
    pair(MINUS,   "MINUS  "),
    pair(TIMES,   "TIMES  "),
    pair(EQUAL,   "EQUAL  "),
    pair(LESS,    "LESS   "),
    pair(GREATER, "GREATER"),
    pair(LEQ,     "LEQ    "),
    pair(GEQ,     "GEQ    "),
    pair(NOT,     "NOT    "),
    pair(DIV,     "DIV    "),
    pair(POP,     "POP    "),
    pair(ASSIGN,  "ASSIGN "),
    pair(JOF,     "JOF    "),
    pair(GOTO,    "GOTO   "),
    pair(LDF,     "LDF    "),
    pair(CALL,    "CALL   "),
    pair(LD,      "LD     "),
    pair(RTN,     "RTN    "),
    pair(DONE,    "DONE   "));
    
// get a the name of an opcode, for debugging

function get_name(op) {
    function lookup(opcodes) {
        return is_null(opcodes) ? error(op, "unknown opcode")
            : op === head(head(opcodes))
            ? tail(head(opcodes))
            : lookup(tail(opcodes));
    }
    return lookup(OPCODES);
}

// pretty-print the program

function print_program(P) {
    let i = 0;
    while (i < array_length(P)) {
        let s = stringify(i);
        const op = P[i];
        s = s + ": " + get_name(P[i]);
        i = i + 1;
        if (op === LDCN || op === LDCB || op === GOTO || 
            op === JOF || op === ASSIGN ||
            op === LDF || op === LD || op === CALL) {
            s = s + " " + stringify(P[i]);
            i = i + 1;
        } else {}
        if (op === LDF) {
            s = s + " " + stringify(P[i]) + " " +
                stringify(P[i + 1]);
            i = i + 2;
        } else {}
        display("", s);
    }
}

// COMPILER FROM SOURCE TO SVML

// parse given string and compile it to machine code
// return the machine code in an array

function parse_and_compile(string) {
    
    // machine_code is array for machine instructions
    const machine_code = [];
    
    // insert_pointer keeps track of the next free place
    // in machine_code
    let insert_pointer = 0;

    // three insert functions (nullary, unary, binary instructions)
    function add_nullary_instruction(op_code) {
        machine_code[insert_pointer] = op_code;
        insert_pointer = insert_pointer + 1;
    }
    // unary instructions have one argument (constant or address)
    function add_unary_instruction(op_code, arg_1) {
        machine_code[insert_pointer] = op_code;
        machine_code[insert_pointer + 1] = arg_1;
        insert_pointer = insert_pointer + 2;
    }
    // binary instructions have two arguments
    function add_binary_instruction(op_code, arg_1, arg_2) {
        machine_code[insert_pointer] = op_code;
        machine_code[insert_pointer + 1] = arg_1;
        machine_code[insert_pointer + 2] = arg_2;        
        insert_pointer = insert_pointer + 3;
    }
    // ternary instructions have three arguments
    function add_ternary_instruction(op_code, arg_1, arg_2, arg_3) {
        machine_code[insert_pointer] = op_code;
        machine_code[insert_pointer + 1] = arg_1;
        machine_code[insert_pointer + 2] = arg_2;   
        machine_code[insert_pointer + 3] = arg_3;    
        insert_pointer = insert_pointer + 4;
    }
        
    // to_compile stack keeps track of remaining compiler work:
    // these are function bodies that still need to be compiled
    let to_compile = null;
    function no_more_to_compile() {
        return is_null(to_compile);
    }
    function pop_to_compile() {
        const next = head(to_compile);
        to_compile = tail(to_compile);
        return next;
    }
    function push_to_compile(task) {
        to_compile = pair(task, to_compile);
    }
    
    // to compile a function body, we need an index table
    // to get the environment indices for each name
    // (parameters, globals and locals)
    // Each compile function returns the max operand stack
    // size needed for running the code. When compilation of 
    // a function body is done, the function continue_to_compile 
    // writes the max operand stack size and the address of the
    // function body to the given addresses.

    function make_to_compile_task(
                 function_body, max_stack_size_address, 
                 address_address, index_table) {
        return list(function_body, max_stack_size_address, 
                    address_address, index_table);
    }
    function to_compile_task_body(to_compile_task) {
        return list_ref(to_compile_task, 0);
    }
    function to_compile_task_max_stack_size_address(to_compile_task) {
        return list_ref(to_compile_task, 1);
    }
    function to_compile_task_address_address(to_compile_task) {
        return list_ref(to_compile_task, 2);
    }
    function to_compile_task_index_table(to_compile_task) {
        return list_ref(to_compile_task, 3);
    }

    // index_table keeps track of environment addresses
    // assigned to names
    function make_empty_index_table() {
        return null;
    }
    function extend_index_table(t, s) {
        return is_null(t) 
            ? list(pair(s, 0))
            : pair(pair(s, tail(head(t)) + 1), t);
    }
    function index_of(t, s) {
        return is_null(t)
            ? error(s, "name not found:")
            : head(head(t)) === s 
            ? tail(head(t))
            : index_of(tail(t), s);
    }

    // a small complication: the toplevel function
    // needs to return the value of the last statement
    let toplevel = true;
    
    function continue_to_compile() {
        while (! is_null(to_compile)) {
            const next_to_compile = pop_to_compile();
            const address_address = 
                      to_compile_task_address_address(next_to_compile);
            machine_code[address_address] = insert_pointer;
            const index_table = 
                      to_compile_task_index_table(next_to_compile);
            const max_stack_size_address =
                      to_compile_task_max_stack_size_address(
                          next_to_compile);
            const body = to_compile_task_body(next_to_compile);
            const max_stack_size =
                      compile(body, index_table, true);
            machine_code[max_stack_size_address] = 
                      max_stack_size;
            toplevel = false;
        }
    }
    
    function local_names(stmt) {
        if (is_sequence(stmt)) {
            const stmts = sequence_statements(stmt);
            return is_empty_sequence(stmts)
                ? null
                : append(
                    local_names(first_statement(stmts)),
                    local_names(make_sequence(
		               rest_statements(stmts))));
        } else {
            return is_constant_declaration(stmt)
                ? list(constant_declaration_name(stmt))
                : null;
        }
    }	  
    
    // compile_arguments compiles the arguments and
    // computes the maximal stack size needed for 
    // computing the arguments. Note that the arguments
    // themselves accumulate on the operand stack, which
    // explains the "i + compile(...)"
    function compile_arguments(exprs, index_table) {
        let i = 0;
        let s = length(exprs);
        let max_stack_size = 0;
        while (i < s) {
            max_stack_size = math_max(i + 
                                      compile(head(exprs), index_table, 
                                          false),
                                      max_stack_size);
            i = i + 1;
            exprs = tail(exprs);
        }
        return max_stack_size;
    }
    
    function compile_boolean_operation(expr, index_table) {
        if (boolean_operator_name(expr) === "&&") {
            return compile(make_conditional_expression(
                                         first_operand(
                                             operands(expr)),
                                         first_operand(
                                             rest_operands(
                                                 operands(expr))),
                                         false), 
                                     index_table,
                                     false);
        } else {
            return compile(make_conditional_expression(
                                         first_operand(
                                             operands(expr)),
                                         true,
                                         first_operand(
                                             rest_operands(
                                                 operands(expr)))),
                                     index_table,
                                     false);
        }
    }
    
    function compile_conditional_expression(expr, index_table, insert_flag) {
        const m_1 = compile(cond_expr_pred(expr), 
                            index_table, false);
        add_unary_instruction(JOF, NaN);
        const JOF_address_address = insert_pointer - 1;
        const m_2 = compile(cond_expr_cons(expr), 
                            index_table, insert_flag);
        let GOTO_address_address = NaN;
        if (!insert_flag) {
            add_unary_instruction(GOTO, NaN);
            GOTO_address_address = insert_pointer - 1;
        } else {}
        machine_code[JOF_address_address] = insert_pointer;
        const m_3 = compile(cond_expr_alt(expr), 
                            index_table, insert_flag);
        if (!insert_flag) {
            machine_code[GOTO_address_address] = insert_pointer;
        } else {}
        return math_max(m_1, m_2, m_3);
    }
    
    function compile_primitive_application(expr, index_table) {
        const op = primitive_operator_name(expr);
        const ops = operands(expr);
        const operand_1 = first_operand(ops);
        if (op === "!") {
            const max_stack_size = compile(operand_1, index_table, false);
            add_nullary_instruction(NOT);
            return max_stack_size;
        } else {
            const operand_2 = first_operand(rest_operands(ops));
            const op_code = op === "+" ? PLUS
                          : op === "-" ? MINUS
                          : op === "*" ? TIMES
                          : op === "/" ? DIV
                          : op === "===" ? EQUAL
                          : op === "<" ? LESS
                          : op === "<=" ? LEQ
                          : op === ">" ? GREATER
                          : op === ">=" ? GEQ
                          : error(op, "unknown operator:");
            const m_1 = compile(operand_1, index_table, false);
            const m_2 = compile(operand_2, index_table, false);
            add_nullary_instruction(op_code);
            return math_max(m_1, 1 + m_2);
        }
    }
            
    function compile_application(expr, index_table) {    
        const max_stack_operator = compile(operator(expr),
                                       index_table, false);
        const max_stack_operands = compile_arguments(operands(expr),
                                       index_table);
        add_unary_instruction(CALL, length(operands(expr)));
        return math_max(max_stack_operator, max_stack_operands + 1);
    }
    
    function compile_function_definition(expr, index_table) {
        const body = function_definition_body(expr);
        const locals = local_names(body);
        const parameters = 
            map(x => name_of_name(x), function_definition_parameters(expr));
        const extended_index_table =
            accumulate((s, it) => extend_index_table(it, s),
                       index_table,
                       append(reverse(locals), 
                       reverse(parameters)));
        add_ternary_instruction(LDF, NaN, NaN, 
                               length(parameters) + length(locals));
        const max_stack_size_address = insert_pointer - 3;
        const address_address = insert_pointer - 2;
        push_to_compile(make_to_compile_task(
                            body, max_stack_size_address, 
                            address_address, extended_index_table));
        return 1;
    }
    
    function compile_sequence(expr, index_table, insert_flag) {
        const statements = sequence_statements(expr);
        if (is_empty_sequence(statements)) {
            return 0;
        } else if (is_last_statement(statements)) {
            return compile(first_statement(statements), 
                           index_table, insert_flag);
        } else {
            const m_1 = compile(first_statement(statements), 
                                index_table, false);
            add_nullary_instruction(POP);
            const m_2 = compile(make_sequence(rest_statements(statements)), 
                                index_table, insert_flag);
            return math_max(m_1, m_2);
        }
    }
    
    function compile_constant_declaration(expr, index_table) {
        const name = constant_declaration_name(expr);
        const index = index_of(index_table, name);
        const max_stack_size = compile(constant_declaration_value(expr),
                                 index_table, false);
        add_unary_instruction(ASSIGN, index);
        add_nullary_instruction(LDCU);
        return max_stack_size;
    }

    function compile_variable_declaration(expr, index_table) {
        // ???
        return 0;
    }
    
    function compile_assignment(expr, index_table) {
        // ???
        return 0;
    }
    
    function compile(expr, index_table, insert_flag) {
        let max_stack_size = 0;
        if (is_number(expr)) {
            add_unary_instruction(LDCN, expr);
            max_stack_size = 1;
        } else if (is_boolean(expr)) {
            add_unary_instruction(LDCB, expr);    
            max_stack_size = 1;
        } else if (is_undefined_expression(expr)) {
            add_nullary_instruction(LDCU);  
            max_stack_size = 1;
        } else if (is_boolean_operation(expr)) {
            max_stack_size = 
            compile_boolean_operation(expr, index_table);
        } else if (is_conditional_expression(expr)) {
            max_stack_size = 
            compile_conditional_expression(expr, index_table, insert_flag);
            insert_flag = false;
        } else if (is_primitive_application(expr)) {
            max_stack_size = 
            compile_primitive_application(expr, index_table);
        } else if (is_application(expr)) {
            max_stack_size = 
            compile_application(expr, index_table);
        } else if (is_function_definition(expr)) {
            max_stack_size =
            compile_function_definition(expr, index_table);
        } else if (is_name(expr)) {
            add_unary_instruction(LD, index_of(index_table, 
                                  name_of_name(expr)));
            max_stack_size = 1;
        } else if (is_sequence(expr)) {
            max_stack_size =
            compile_sequence(expr, index_table, insert_flag);
            insert_flag = false;
        } else if (is_constant_declaration(expr)) {
            max_stack_size =
            compile_constant_declaration(expr, index_table);
        } else if (is_assignment(expr)) {
            max_stack_size =
            compile_assignment(expr, index_table);
        } else if (is_return_statement(expr)) {
            max_stack_size = compile(return_statement_expression(expr), 
                                     index_table, false);
        } else {
            error(expr, "unknown expression:");
        }
        
        // handling of return
        if (insert_flag) {
            if (is_return_statement(expr)) {
                add_nullary_instruction(RTN);
            } else if (toplevel && 
                       (is_self_evaluating(expr) ||
                        is_undefined_expression(expr) ||
                        is_application(expr) ||
                        is_name(expr) ||
                        is_primitive_application(expr))
                      ) {
                add_nullary_instruction(RTN);
            } else {
                add_nullary_instruction(LDCU);
                max_stack_size = max_stack_size + 1;
                add_nullary_instruction(RTN);
            } 
        } else {}
        return max_stack_size;
    }
    
    const program = parse(string);
    add_nullary_instruction(START);
    add_ternary_instruction(LDF, NaN, NaN, 
                            length(local_names(program)));
    const LDF_max_stack_size_address = insert_pointer - 3;
    const LDF_address_address = insert_pointer - 2;
    add_unary_instruction(CALL, 0);
    add_nullary_instruction(DONE);
    
    const locals = reverse(local_names(program));
    const program_names_index_table =
         accumulate((s, it) => extend_index_table(it, s),
                    make_empty_index_table(),
                    locals);
    
    push_to_compile(make_to_compile_task(
                        program, 
                        LDF_max_stack_size_address, 
                        LDF_address_address, 
                        program_names_index_table));
    continue_to_compile();
    return machine_code;
}

// VIRTUAL MACHINE

// "registers" are the global variables of our machine. 
// These contain primitive values (numbers or boolean 
// values) or arrays of primitive values

// P is an array that contains an SVML machine program: 
// the op-codes of instructions and their arguments
let P = [];
// PC is program counter: index of the next instruction
let PC = 0;
// HEAP is array containing all dynamically allocated data structures
const HEAP = [];
// next free slot in heap
let FREE = 0;
// OS is address of current environment in HEAP; initially a dummy value
let ENV = -Infinity;
// OS is address of current operand stack in HEAP; initially a dummy value
let OS = -Infinity;
// temporary value, used by PUSH and POP; initially a dummy value
let RES = -Infinity;   

// some general-purpose registers
let A = 0;
let B = 0;
let C = 0;
let D = 0;
let E = 0;
let F = 0;
let G = 0;
let H = 0;

function show_executing(s) {
    display("", "--- RUN ---" + s);
    display( PC, "PC :");
    display( get_name(P[PC]), "instr:");
}

// for debugging: show all registers
function show_registers(s) {
    show_executing(s);
    display("", "--- REGISTERS ---");
    display(RES, "RES:");
    display(  A, "A  :");
    display(  B, "B  :");
    display(  C, "C  :");
    display(  D, "D  :");
    display(  E, "E  :");
    display(  F, "F  :");
    display(  G, "G  :");
    display(  H, "H  :");
    display( OS, "OS :");
    display(ENV, "ENV:");
    display(RTS, "RTS:");
    display(TOP_RTS, "TOP_RTS:");
}

// register that says if machine is running                   
let RUNNING = true;

const NORMAL = 0;
const DIV_ERROR = 1;
const OUT_OF_MEMORY_ERROR = 2; // not used yet: memory currently unbounded

let STATE = NORMAL;

// general node layout
const TAG_SLOT = 0;
const SIZE_SLOT = 1;
const FIRST_CHILD_SLOT = 2;
const LAST_CHILD_SLOT = 3;

// NEW expects tag in A and size in B
function NEW() {
    HEAP[FREE + TAG_SLOT] = A;
    HEAP[FREE + SIZE_SLOT] = B;
    RES = FREE;
    FREE = FREE + B;
}

// number nodes layout
//
// 0: tag  = -100
// 1: size = 5
// 2: offset of first child from the tag: 6 (no children)
// 3: offset of last child from the tag: 5 (must be less than first)
// 4: value

const NUMBER_TAG = -100;
const NUMBER_SIZE = 5;
const NUMBER_VALUE_SLOT = 4;

function NEW_NUMBER() {
    C = A;
    A = NUMBER_TAG;
    B = NUMBER_SIZE;
    NEW();
    HEAP[RES + FIRST_CHILD_SLOT] = 6;
    HEAP[RES + LAST_CHILD_SLOT] = 5; // no children
    HEAP[RES + NUMBER_VALUE_SLOT] = C;
}

// bool nodes layout
//
// 0: tag  = -101
// 1: size = 5
// 2: offset of first child from the tag: 6 (no children)
// 3: offset of last child from the tag: 5 (must be less than first)
// 4: value

const BOOL_TAG = -101;
const BOOL_SIZE = 5;
const BOOL_VALUE_SLOT = 4;

function NEW_BOOL() {
    C = A;
    A = BOOL_TAG;
    B = BOOL_SIZE;
    NEW();
    HEAP[RES + FIRST_CHILD_SLOT] = 6;
    HEAP[RES + LAST_CHILD_SLOT] = 5; // no children
    HEAP[RES + BOOL_VALUE_SLOT] = C;
}

// undefined nodes layout
//
// 0: tag  = -106
// 1: size = 4
// 2: offset of first child from the tag: 5 (no children)
// 3: offset of last child from the tag: 4 (must be less than first)

const UNDEFINED_TAG = -106;
const UNDEFINED_SIZE = 4;

function NEW_UNDEFINED() {
    A = UNDEFINED_TAG;
    B = UNDEFINED_SIZE;
    NEW();
    HEAP[RES + FIRST_CHILD_SLOT] = 5;
    HEAP[RES + LAST_CHILD_SLOT] = 4; // no children
}

// operandstack nodes layout
//
// 0: tag  = -105
// 1: size = maximal number of entries + 4
// 2: first child slot = 4
// 3: last child slot = current top of stack; initially 3 (empty stack)
// 4: first entry
// 5: second entry
// ...

const OS_TAG = -105;

// expects max size in A
function NEW_OS() {
    C = A;
    A = OS_TAG;
    B = C + 4;
    NEW();
	HEAP[RES + FIRST_CHILD_SLOT] = 4;
	// operand stack initially empty
	HEAP[RES + LAST_CHILD_SLOT] = 3;
}

// PUSH and POP are convenient subroutines that operate on
// the operand stack OS
// PUSH expects its argument in A
function PUSH_OS() {
    B = HEAP[OS + LAST_CHILD_SLOT]; // address of current top of OS
    B = B + 1; 
    HEAP[OS + LAST_CHILD_SLOT] = B; // update address of current top of OS
    HEAP[OS + B] = A;
}

// POP puts the top-most value into RES
// uses B
function POP_OS() {
    B = HEAP[OS + LAST_CHILD_SLOT]; // address of current top of OS
    HEAP[OS + LAST_CHILD_SLOT] = B - 1; // update address of current top of OS
    RES = HEAP[OS + B];
}

// closure nodes layout
//
// 0: tag  = -103
// 1: size = 8
// 2: offset of first child from the tag: 6 (only environment)
// 3: offset of last child from the tag: 6
// 4: stack size = max stack size needed for executing function body
// 5: address = address of function
// 6: environment
// 7: extension count = number of entries by which to extend env

const CLOSURE_TAG = -103;
const CLOSURE_SIZE = 8;
const CLOSURE_OS_SIZE_SLOT = 4;
const CLOSURE_ADDRESS_SLOT = 5;
const CLOSURE_ENV_SLOT = 6;
const CLOSURE_ENV_EXTENSION_COUNT_SLOT = 7;

// expects stack size in A, address in B, environment extension count in C
function NEW_CLOSURE() {
    E = A;
    F = B;
    A = CLOSURE_TAG;
    B = CLOSURE_SIZE;
    NEW();
    A = E;
    B = F;
	HEAP[RES + FIRST_CHILD_SLOT] = CLOSURE_ENV_SLOT;
	HEAP[RES + LAST_CHILD_SLOT] = CLOSURE_ENV_SLOT;
	HEAP[RES + CLOSURE_OS_SIZE_SLOT] = A;
	HEAP[RES + CLOSURE_ADDRESS_SLOT] = B;
    HEAP[RES + CLOSURE_ENV_SLOT] = ENV;
    HEAP[RES + CLOSURE_ENV_EXTENSION_COUNT_SLOT] = C;
}

// expects closure in A, environment in B
function SET_CLOSURE_ENV() {
    HEAP[A + CLOSURE_ENV_SLOT] = B;
}

// stackframe nodes layout
//
// 0: tag  = -104
// 1: size = 7
// 2: offset of first child from the tag: 5 (environment)
// 3: offset of last child from the tag: 6 (operand stack)
// 4: program counter = return address
// 5: environment
// 6: operand stack

const RTS_FRAME_TAG = -104;
const RTS_FRAME_SIZE = 7;
const RTS_FRAME_PC_SLOT = 4;
const RTS_FRAME_ENV_SLOT = 5;
const RTS_FRAME_OS_SLOT = 6;

// expects current PC, ENV, OS in their registers
function NEW_RTS_FRAME() {
    A = RTS_FRAME_TAG;
    B = RTS_FRAME_SIZE;
    NEW();
	HEAP[RES + FIRST_CHILD_SLOT] = RTS_FRAME_ENV_SLOT;
	HEAP[RES + LAST_CHILD_SLOT] = RTS_FRAME_OS_SLOT;
	HEAP[RES + RTS_FRAME_PC_SLOT] = PC + 2; // next instruction!
	HEAP[RES + RTS_FRAME_ENV_SLOT] = ENV;
    HEAP[RES + RTS_FRAME_OS_SLOT] = OS;
}


const RTS = [];
let TOP_RTS = -1;

// expects stack frame in A
function PUSH_RTS() {
    TOP_RTS = TOP_RTS + 1;
    RTS[TOP_RTS] = A;
}

// places stack frame into RES
function POP_RTS() {
    RES = RTS[TOP_RTS];
    TOP_RTS = TOP_RTS - 1;
}



// environment nodes layout
//
// 0: tag  = -102
// 1: size = number of entries + 4
// 2: first child = 4
// 3: last child 
// 4: first entry
// 5: second entry
// ...

const ENV_TAG = -102;

// expects number of env entries in A
// changes B
function NEW_ENVIRONMENT() {
    C = A;
    A = ENV_TAG;
    B = C + 4;
    NEW();
    HEAP[RES + FIRST_CHILD_SLOT] = 4;
    HEAP[RES + LAST_CHILD_SLOT] = 3 + C;
}

// expects env in A, by-how-many in B
function EXTEND() {
    D = A;
    A = HEAP[A + SIZE_SLOT] - 4 + B;
    NEW_ENVIRONMENT();
    for (B = HEAP[D + FIRST_CHILD_SLOT]; 
         B <= HEAP[D + LAST_CHILD_SLOT];
         B = B + 1) {
        HEAP[RES + B] = HEAP[D + B];
    }
}

// debugging: show current heap
function is_node_tag(x) {
    return x !== undefined && x <= -100 && x >= -110;
}
function node_kind(x) {
    return x ===      NUMBER_TAG ? "number"
         : x ===        BOOL_TAG ? "bool"
         : x ===     CLOSURE_TAG ? "closure"
         : x ===   RTS_FRAME_TAG ? "RTS frame"
         : x ===          OS_TAG ? "OS"
         : x ===         ENV_TAG ? "environment"
         : x ===   UNDEFINED_TAG ? "undefined"
         : " (unknown node kind)";
}
function show_heap(s) {
    const len = array_length(HEAP);
    let i = 0;
    display("", "--- HEAP --- " + s);
    while (i < len) {
        display("", stringify(i) + ": " + stringify(HEAP[i]) +
                    (is_number(HEAP[i]) && is_node_tag(HEAP[i]) 
                     ? " ("+node_kind(HEAP[i])+")" 
                     : ""));
        i = i + 1;
    }
}

function show_heap_value(address) {
    display("", "result: heap node of type = " + 
                node_kind(HEAP[address]) +
                ", value = " + 
                stringify(HEAP[address + NUMBER_VALUE_SLOT]));
    
}

// SVMLa implementation

// We implement our machine with an array M that
// contains subroutines. Each subroutine implements
// a machine instruction, using a nullary function. 
// The machine can then index into M using the op-codes
// of the machine instructions. To be implementable on
// common hardware, the subroutines have the 
// following structure:
// * they have no parameters
// * they do not return any results
// * they do not have local variables
// * they do not call other functions except the 
//   subroutines PUSH and POP
// * each line is very simple, for example an array access
// Ideally, each line can be implemented directly with a
// machine instruction of a real computer. In that case,
// the subroutines could become machine language macros, 
// and the compiler could generate real machine code.

const M = [];

M[START] = () =>   { A = 1; // first OS only needs to hold one closure
                     NEW_OS();
                     OS = RES;
                     A = 0;
                     NEW_ENVIRONMENT();
                     ENV = RES;
                     PC = PC + 1;
                   };

M[LDCN] = () =>    { A = P[PC + LDCN_VALUE_OFFSET];
                     NEW_NUMBER();
                     A = RES;
                     PUSH_OS();
                     PC = PC + 2;
                   };

M[LDCB] = () =>    { A = P[PC + LDCB_VALUE_OFFSET]; 
                     NEW_BOOL();
                     A = RES;
                     PUSH_OS();
                     PC = PC + 2;
                   };

M[LDCU] = () =>    { NEW_UNDEFINED();
                     A = RES;
                     PUSH_OS();
                     PC = PC + 1;
                   };
                   
M[PLUS] = () =>    { POP_OS();
                     A = HEAP[RES + NUMBER_VALUE_SLOT];
                     POP_OS();
                     A = HEAP[RES + NUMBER_VALUE_SLOT] + A;
                     NEW_NUMBER();
                     A = RES;
                     PUSH_OS();
                     PC = PC + 1;
                   };

M[MINUS] = () =>   { POP_OS();
                     A = HEAP[RES + NUMBER_VALUE_SLOT];
                     POP_OS();
                     A = HEAP[RES + NUMBER_VALUE_SLOT] - A;
                     NEW_NUMBER();
                     A = RES;
                     PUSH_OS();
                     PC = PC + 1;
                   };

M[TIMES] = () =>   { POP_OS();
                     A = HEAP[RES + NUMBER_VALUE_SLOT];
                     POP_OS();
                     A = HEAP[RES + NUMBER_VALUE_SLOT] * A;
                     NEW_NUMBER();
                     A = RES;
                     PUSH_OS();
                     PC = PC + 1;
                   };
     
M[EQUAL] = () =>   { POP_OS();
                     A = HEAP[RES + NUMBER_VALUE_SLOT];
                     POP_OS();
                     A = HEAP[RES + NUMBER_VALUE_SLOT] === A;
                     NEW_BOOL();
                     A = RES;
                     PUSH_OS();
                     PC = PC + 1;
                   };
         
M[LESS] = () =>    { POP_OS();
                     A = HEAP[RES + NUMBER_VALUE_SLOT];
                     POP_OS();
                     A = HEAP[RES + NUMBER_VALUE_SLOT] < A;
                     NEW_BOOL();
                     A = RES;
                     PUSH_OS();
                     PC = PC + 1;
                   };
     
M[GEQ] = () =>     { POP_OS();
                     A = HEAP[RES + NUMBER_VALUE_SLOT];
                     POP_OS();
                     A = HEAP[RES + NUMBER_VALUE_SLOT] >= A;
                     NEW_BOOL();
                     A = RES;
                     PUSH_OS();
                     PC = PC + 1;
                   };

M[LEQ] = () =>     { POP_OS();
                     A = HEAP[RES + NUMBER_VALUE_SLOT];
                     POP_OS();
                     A = HEAP[RES + NUMBER_VALUE_SLOT] <= A;
                     NEW_BOOL();
                     A = RES;
                     PUSH_OS();
                     PC = PC + 1;
                   };
     
M[GREATER] = () => { POP_OS();
                     A = HEAP[RES + NUMBER_VALUE_SLOT];
                     POP_OS();
                     A = HEAP[RES + NUMBER_VALUE_SLOT] > A;
                     NEW_BOOL();
                     A = RES;
                     PUSH_OS();
                     PC = PC + 1;
                   };

M[NOT] = () =>     { POP_OS();
                     A = ! HEAP[RES + BOOL_VALUE_SLOT];
                     NEW_BOOL();
                     A = RES;
                     PUSH_OS();
                     PC = PC + 1;
                   };

M[DIV] = () =>     { POP_OS();
                     A = HEAP[RES + NUMBER_VALUE_SLOT];
                     E = A;
                     POP_OS();
                     A = HEAP[RES + NUMBER_VALUE_SLOT] / A;
                     NEW_NUMBER();
                     A = RES;
                     PUSH_OS();
                     PC = PC + 1;
                     E = E === 0;
                     if (E) { STATE = DIV_ERROR; } else {}
                     if (E) { RUNNING = false; } else {}
                   };
                   
M[POP] = () =>     { POP_OS();
                     PC = PC + 1;
                   };
                   
M[ASSIGN] = () =>  { POP_OS();
                     HEAP[ENV + HEAP[ENV + FIRST_CHILD_SLOT] 
                              + P[PC + 1]] = RES;
                     PC = PC + 2;
                   };
                   
M[JOF] = () =>     { POP_OS();
                     A = HEAP[RES + NUMBER_VALUE_SLOT];
                     if (!A) { PC = P[PC + 1]; } else {}
                     if (A) { PC = PC + 2; } else {}
                   };

M[GOTO] = () =>    { PC = P[PC + 1]; 
                   };

M[LDF] = () =>     { A = P[PC + LDF_MAX_OS_SIZE_OFFSET];
                     B = P[PC + LDF_ADDRESS_OFFSET];
                     C = P[PC + LDF_ENV_EXTENSION_COUNT_OFFSET];
                     NEW_CLOSURE();
                     A = RES;
                     PUSH_OS();
                     PC = PC + 4;
                   };

M[LD] = () =>      { A = HEAP[ENV + HEAP[ENV + FIRST_CHILD_SLOT] 
                                  + P[PC + 1]];
                     PUSH_OS();
                     PC = PC + 2;
                   };
                   
M[CALL] = () =>    { G = P[PC + 1];  // lets keep number of arguments in G
                     // we peek down OS to get the closure
                     F = HEAP[OS + HEAP[OS + LAST_CHILD_SLOT] - G]; 
                     // prep for EXTEND
                     A = HEAP[F + CLOSURE_ENV_SLOT];
                     // A is now env to be extended
                     H = HEAP[A + LAST_CHILD_SLOT]; 
                     // H is now offset of last child slot
                     B = HEAP[F + CLOSURE_ENV_EXTENSION_COUNT_SLOT];
                     // B is now the environment extension count
                     EXTEND(); // after this, RES is new env
                     E = RES;
                     H = E + H + G; 
                     // H is now address where last argument goes in new env
                     for (C = H; C > H - G; C = C - 1) {
                         POP_OS(); // now RES has the address of the next arg
                         HEAP[C] = RES; // copy argument into new env
                     }
                     POP_OS(); // closure is on top of OS; pop it as not needed
                     NEW_RTS_FRAME(); // saves PC+2, ENV, OS
                     A = RES;
                     PUSH_RTS();
                     PC = HEAP[F + CLOSURE_ADDRESS_SLOT];
                     A = HEAP[F + CLOSURE_OS_SIZE_SLOT]; // closure stack size
                     NEW_OS();    // uses B and C
                     OS = RES;
                     ENV = E;
                   };
                   
M[RTN] = () =>     { POP_RTS();
                     H = RES;
                     PC = HEAP[H + RTS_FRAME_PC_SLOT];
                     ENV = HEAP[H + RTS_FRAME_ENV_SLOT];
                     POP_OS();
                     A = RES;
                     OS = HEAP[H + RTS_FRAME_OS_SLOT];
                     PUSH_OS();
                    };

M[DONE] = () =>    { RUNNING = false;
                   };
                   
function run() {
    while (RUNNING) { 
        //show_registers("run loop");
        //show_heap("run loop");
        if (M[P[PC]] === undefined) {
            error(P[PC], "unknown op-code:");
        } else {
            M[P[PC]](); 
        }
    } 
    if (STATE === DIV_ERROR) {
        POP_OS();
        error(RES, "execution aborted:");
    } else {
        POP_OS();
        show_heap_value(RES); 
    }
}


// EXAMPLES

/*
// simple hand-coded example, computing 21 - 4
P =
[ START,
  LDCN, 21,
  LDCN, 4,
  MINUS,
  DONE
];
run();
*/

/*
// simple hand-coded example, computing 3 * (17 + 4)
P =
[ START,
  LDCN, 3,
  LDCN, 17,
  LDCN, 4,
  PLUS,
  TIMES,
  DONE
];
run();
*/

// compiler and VM test cases

/*
 P = parse_and_compile("true ? 11 : 22;");
 display(P);
run();
*/

/*
P = parse_and_compile("false ? 11 : 22;");
display(P);
run();
*/

/*
P = parse_and_compile("! (true || false);");
print_program(P);
run();
*/

/*
 P = parse_and_compile("1 + 1 === 2;");
 print_program(P);
 run();
*/

/*
P = parse_and_compile("1 + 2 * 3 * 4 - 5;");
run(); 
*/

/*
P = parse_and_compile("1 + 1 / 0;");
run();
*/

/*
P = parse_and_compile("1000 + 2000 / 3000;");
print_program(P);
run();
*/

/*
P = parse_and_compile("1; 2; 3;");
print_program(P);
run();
*/

/*
P = parse_and_compile("const x = 1; x + 2;");
print_program(P);
run();
*/

/*
P = parse_and_compile("undefined;");
print_program(P);
run();
*/

/*
P = parse_and_compile("     \
function f(x) {             \
    return x + 1;           \
}                           \
f(2);                       ");
print_program(P);
run();
*/

/*
P = parse_and_compile("             \
const a = 2;                        \
const b = 7;                        \
function f(x, y) {                  \
    const c = 100;                  \
    const d = 500;                  \
    return x - y * a + b - c + d;   \
}                                   \
f(30, 10);                          ");
print_program(P);
run();
*/

/*
P = parse_and_compile("         \
function factorial(n) {         \
    return n === 1 ? 1          \
        : n * factorial(n - 1); \
}                               \
factorial(4);                   ");
//print_program(P);
run();
*/

/*
P = parse_and_compile("         \
const about_pi = 3;             \
function square(x) {            \
    return x * x;               \
}                               \
4 * about_pi * square(6371);    ");
//print_program(P);
run();
*/

/*
P = parse_and_compile("           \
function power(x, y) {            \
    return y === 0                \
        ? 1                       \
        : x * power(x, y - 1);    \
}                                 \
power(17, 3);                     ");
//print_program(P);
run();
*/

/*
P = parse_and_compile("                                     \
function recurse(x, y, operation, initvalue) {              \
    return y === 0                                          \
        ? initvalue                                         \
        : operation(x, recurse(x, y - 1,                    \
                    operation, initvalue));                 \
}                                                           \
                                                            \
function f(x, z) { return x * z; }                          \
recurse(2, 3, f, 1);                                        \
                                                            \
function g(x, z) { return x + z; }                          \
recurse(2, 3, g, 0);                                        \
                                                            \
function h(x, z) { return x / z; }                          \
recurse(2, 3, h, 128);                                      ");
//print_program(P);
run();
*/

/*
P = parse_and_compile("                         \
function abs(x) {                               \
    return x >= 0 ? x : 0 - x;                  \
}                                               \
function square(x) {                            \
    return x * x;                               \
}                                               \
function average(x,y) {                         \
    return (x + y) / 2;                         \
}                                               \
function sqrt(x) {                              \
    function good_enough(guess, x) {            \
        return abs(square(guess) - x) < 0.001;  \
    }                                           \
    function improve(guess, x) {                \
        return average(guess, x / guess);       \
    }                                           \
    function sqrt_iter(guess, x) {              \
        return good_enough(guess, x)            \
                   ? guess                      \
                   : sqrt_iter(improve(         \
                                guess, x), x);  \
    }                                           \
    return sqrt_iter(1.0, x);                   \
}                                               \
                                                \
sqrt(5);                                        ");
//print_program(P);
run();
*/

