'''
difficulty_level = (1 to 5)
1 - very easy
2 - easy
3 - medium
4 - hard
5 - very hard'''


predicted_difficulty = ("how difficult the question was to the user ")
difficulty_level = 1
if(answered correctly){
    if(predicted_difficulty<=2){
        if(consecutive_correct >=3){
            difficulty_level = min(difficulty_level+2,5)
        }
    }
    else if(predicted_difficulty>2 and predicted_difficulty<=4){
        if(consecutive_correct >=3){
            difficulty_level =min(difficulty_level+1,5);
        }
    }
    else{#as the user improves his difficulty in the same set ofquestions will improve and he will
        # be able to answer the questions and by this time the pred diff will 
        # be satisfied in above cases
        if(consecutive_answer>=3){
            print("Common it's an improvment")
        }
    }

}
else
    { #answered wrongly


    if(predicted_difficulty >2 to 4){//konja kastama
        if(consective_wrongs >=3){
            difficulty_level = max(1,difficulty_level-2);
        }
    }
    else if(predicted_difficulty >4 to 5){//romba kastam
        if(consective_wrongs >=2){
            difficulty_level = max(1,difficulty_level-3);
        }
    }
    else{//predicted_difficulty ==1 to 2 
        if(consecutive_wrong>=4){
            difficulty_level = max(1,difficulty_level-1);
        }
    }
}
    

#we find some difficulty_level value 
#class 5 is opted for generating question based on the difficulty level
#i) varying the size of the operands
#ii)various operators(+,-,*,/)
#iii) Whether to give the hints or not


if(difficulty_level == 1){//very easy
   #no of operands = 2
   #operations:{addition,subtraction}
   #range:{0,9}
   #hints:[very basic hint] (like how to do addition)
}
else if(difficulty_level == 2){
  #range:{0,20}
  #operations:{+,-,*,/}
  #zero cannot be added in denominator for division
  #no of operands:2
  #hint:an image explaining the operation

}
else if(difficulty_level == 3){
    #addition and subtraction : 
    # operand range(10 to 999) : first operand (3 digits) and second operand (2 digits)
    #multiplication and division:
    #operand range:(10 to 99)(for multiplication)
    #no of operands : 2 
   ''' 99X99
    99
   99 
   ----

   ----
   #for division: numerator:2digits
   denominator: one digit
   '''
   '''
   99/9
   '''
}
else if(difficulty_level == 4){#hard
    #additon and subtraction and multiplication
    #3 - 4 operands
    # operand range:
    # (999 to 10000)
    #division:
    #2 operands
    #operand range: 1 -999 / 1- 99 
    #hints: yes
}
else{#hints can be provided #very hard
    #+,-,
    #operand: 
    #range:10000 to 50000
    #no of operands: 4 to 5
    #*(mult)
    #no of operands : 3
    #range: all operands should be 3 digits(upto 999)
    #/(for division)
    #no of operands:2
    #range :dividend: 1 to 50000
    #divisor:upto 99 
    #no hint
}