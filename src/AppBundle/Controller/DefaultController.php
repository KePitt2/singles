<?php

namespace AppBundle\Controller;

use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\ParamConverter;
use AppBundle\Entity\Single;

class DefaultController extends Controller
{
    /**
     * @Route("/", name="default_homepage")
     */
    public function indexAction(Request $request)
    {
        if(!$request->get('ver')){
            throw $this->createNotFoundException('Eres demasiado list@, pero yo más... Sigue tonteando y el ...');
        }
        
        $em = $this->getDoctrine()->getRepository('AppBundle:Single');
        
        return $this->render('default/index.html.twig', [
            'girls' => $em->findBy(['gender' => false], ['clicks' => 'desc'], $request->get('limit', 3)),
            'boys' => $em->findBy(['gender' => true], ['clicks' => 'desc'], $request->get('limit', 3))
        ]);
    }
    
    /**
     * @Route("/ver/{single}", name="default_view")
     * @ParamConverter("single", class="AppBundle:Single")
     */
    public function viewAction(Request $request, Single $single)
    {
        $add = $single->getClicks() + $request->get('add',1);
        $single->setClicks($add);
        
        $this->getDoctrine()->getManager()->flush();
        
        return $this->redirectToRoute('default_single', [
            'single' => $single->getId()
        ]);
    }
    
    /**
     * @Route("single/{single}", name="default_single")
     * @ParamConverter("single", class="AppBundle:Single")
     */
    public function singleAction(Request $request, Single $single)
    {
        return $this->render('default/view.html.twig', [
            'single' => $single
        ]);
    }
}
