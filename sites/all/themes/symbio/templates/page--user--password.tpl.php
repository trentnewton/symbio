<header id="login-header">
  <div class="row">
    <div class="column">
      <a href="<?php print render($front_page); ?>" class="responsive-svg-container">
        <svg class="responsive-svg top-bar-logo" aria-labelledby="logo" preserveAspectRatio="xMinYMin meet" viewBox="0 0 680.2 119.5"><use xlink:href="#logo"/></svg>
      </a>
    </div>
  </div>
</header>
<main id="login-body">
  <div class="row">
    <div class="medium-6 small-centered columns">
      <div class="text-center">
        <h1><?php print $title; ?></h1>
      </div>
    </div>
  </div> 
  <div class="row">
    <div class="medium-6 small-centered columns login-form-box-wrapper">
      <div class="login-form-box text-center">
        <div class="row">
          <div class="column">
            <?php print $messages; ?>
          </div>
        </div>
        <div class="row">
          <div class="column">
            <?php print render($page['content']); ?>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>
<footer id="login-footer">
  <div class="row">
    <div class="column">
      <p class="copyright">
      <?php if ($page['copyright']): ?>
        <?php print render($page['copyright']); ?>
      <?php endif; ?>
      </p>
      <nav>
        <a href="<?php print render($front_page); ?>"><svg class="icon icon-home"><use xlink:href="#icon-home"></use></svg>&nbsp;<?php print t('Home'); ?></a>
      </nav>
    </div>
  </div>
</footer>