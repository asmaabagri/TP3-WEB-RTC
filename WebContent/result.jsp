<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Resultat Loterie</title>
</head>
<body bgcolor="#FDF5E6">
    <h1>Greetings <%= request.getAttribute("nomUtilisateur") %>!</h1>
    
    <p>Vous avez gagne: <%= request.getAttribute("montantGain") %> millions de dollars!</p>
    
    <a href="index.html">Rejouer</a>
</body>
</html>