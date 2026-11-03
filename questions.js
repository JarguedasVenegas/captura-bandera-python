export const questions = [
  {
    id: 1,
    level: "Básico",
    title: "La primera bandera",
    points: 50,
    code: 'print("Hola Python")',
    question: "¿Qué muestra este programa?",
    options: ["Hola Python", "print", "Error", "Python Hola"],
    answer: 0,
    hint: "Observa el texto entre comillas."
  },
  {
    id: 2,
    level: "Básico",
    title: "Variables secretas",
    points: 50,
    code: 'edad = 18\nprint(edad)',
    question: "¿Qué valor aparece en pantalla?",
    options: ["edad", "18", "0", "Error"],
    answer: 1,
    hint: "La variable guarda un número."
  },
  {
    id: 3,
    level: "Básico",
    title: "Operación matemática",
    points: 50,
    code: 'a = 8\nb = 3\nprint(a + b)',
    question: "¿Cuál es el resultado?",
    options: ["24", "5", "11", "83"],
    answer: 2,
    hint: "Se utiliza el operador de suma."
  },
  {
    id: 4,
    level: "Básico",
    title: "Entrada de datos",
    points: 50,
    code: 'nombre = input("Nombre: ")\nprint(nombre)',
    question: "¿Qué hace input()?",
    options: [
      "Repite instrucciones",
      "Solicita datos al usuario",
      "Compara números",
      "Finaliza el programa"
    ],
    answer: 1,
    hint: "Permite escribir información."
  },
  {
    id: 5,
    level: "Básico",
    title: "Condición verdadera",
    points: 75,
    code: 'edad = 20\nif edad >= 18:\n    print("Mayor")\nelse:\n    print("Menor")',
    question: "¿Qué mensaje aparece?",
    options: ["Menor", "Mayor", "20", "Error"],
    answer: 1,
    hint: "20 es mayor que 18."
  },
  {
    id: 6,
    level: "Básico",
    title: "La nota final",
    points: 75,
    code: 'nota = 65\nif nota >= 70:\n    print("Aprobado")\nelse:\n    print("Reprobado")',
    question: "¿Qué muestra el programa?",
    options: ["Aprobado", "70", "Reprobado", "65"],
    answer: 2,
    hint: "65 no alcanza 70."
  },
  {
    id: 7,
    level: "Intermedio",
    title: "Tres caminos",
    points: 100,
    code: 'nota = 85\nif nota >= 90:\n    print("Excelente")\nelif nota >= 70:\n    print("Aprobado")\nelse:\n    print("Reprobado")',
    question: "¿Cuál es el resultado?",
    options: ["Excelente", "Aprobado", "Reprobado", "Error"],
    answer: 1,
    hint: "Las condiciones se evalúan en orden."
  },
  {
    id: 8,
    level: "Intermedio",
    title: "El ciclo secreto",
    points: 100,
    code: 'for i in range(3):\n    print(i)',
    question: "¿Qué números se imprimen?",
    options: ["1, 2, 3", "0, 1, 2", "0, 1, 2, 3", "3"],
    answer: 1,
    hint: "range(3) comienza en cero."
  },
  {
    id: 9,
    level: "Intermedio",
    title: "Contador misterioso",
    points: 100,
    code: 'contador = 0\nfor i in range(5):\n    contador += 1\nprint(contador)',
    question: "¿Cuál es el valor final?",
    options: ["4", "0", "5", "10"],
    answer: 2,
    hint: "El ciclo se ejecuta cinco veces."
  },
  {
    id: 10,
    level: "Intermedio",
    title: "Acumulador de puntos",
    points: 100,
    code: 'total = 0\nfor i in range(1, 4):\n    total += i\nprint(total)',
    question: "¿Qué resultado muestra?",
    options: ["3", "4", "6", "10"],
    answer: 2,
    hint: "Suma 1 + 2 + 3."
  },
  {
    id: 11,
    level: "Intermedio",
    title: "El while perdido",
    points: 125,
    code: 'x = 1\nwhile x <= 3:\n    print(x)\n    x += 1',
    question: "¿Cuántas veces se ejecuta print()?",
    options: ["2", "3", "4", "Infinitas"],
    answer: 1,
    hint: "El ciclo termina cuando x llega a 4."
  },
  {
    id: 12,
    level: "Intermedio",
    title: "Número par",
    points: 125,
    code: 'numero = 8\nif numero % 2 == 0:\n    print("Par")\nelse:\n    print("Impar")',
    question: "¿Qué muestra el programa?",
    options: ["Impar", "8", "Par", "0"],
    answer: 2,
    hint: "El residuo de 8 entre 2 es cero."
  },
  {
    id: 13,
    level: "Avanzado",
    title: "Condiciones combinadas",
    points: 150,
    code: 'edad = 20\nnota = 80\nif edad >= 18 and nota >= 70:\n    print("Aceptado")\nelse:\n    print("Rechazado")',
    question: "¿Cuál es el resultado?",
    options: ["Rechazado", "Aceptado", "80", "Error"],
    answer: 1,
    hint: "Con and deben cumplirse ambas condiciones."
  },
  {
    id: 14,
    level: "Avanzado",
    title: "Suma de pares",
    points: 150,
    code: 'total = 0\nfor i in range(1, 7):\n    if i % 2 == 0:\n        total += i\nprint(total)',
    question: "¿Cuál es el total?",
    options: ["6", "9", "12", "21"],
    answer: 2,
    hint: "Suma 2 + 4 + 6."
  },
  {
    id: 15,
    level: "Avanzado",
    title: "Contador condicionado",
    points: 150,
    code: 'contador = 0\nfor i in range(1, 8):\n    if i > 4:\n        contador += 1\nprint(contador)',
    question: "¿Qué valor se imprime?",
    options: ["3", "4", "7", "8"],
    answer: 0,
    hint: "Cuenta 5, 6 y 7."
  },
  {
    id: 16,
    level: "Avanzado",
    title: "Escape del while",
    points: 175,
    code: 'x = 10\nwhile x > 4:\n    x -= 2\nprint(x)',
    question: "¿Cuál es el valor final de x?",
    options: ["6", "4", "2", "10"],
    answer: 1,
    hint: "Resta dos hasta que la condición sea falsa."
  },
  {
    id: 17,
    level: "Experto",
    title: "El acumulador oculto",
    points: 200,
    code: 'total = 0\nfor i in range(1, 6):\n    if i % 2 != 0:\n        total += i\nprint(total)',
    question: "¿Cuál es el resultado?",
    options: ["6", "9", "15", "5"],
    answer: 1,
    hint: "Suma los números impares."
  },
  {
    id: 18,
    level: "Experto",
    title: "La bandera final",
    points: 250,
    code: 'puntos = 0\nfor i in range(1, 5):\n    if i % 2 == 0:\n        puntos += i * 2\n    else:\n        puntos += i\nprint(puntos)',
    question: "¿Cuántos puntos se obtienen?",
    options: ["10", "13", "16", "20"],
    answer: 2,
    hint: "Suma 1 + 4 + 3 + 8."
  }
];
